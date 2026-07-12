const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();
const prisma = new PrismaClient();

// All employee routes require auth + admin
router.use(auth, adminOnly);

// GET /api/employees
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(employees);
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/employees/:id/role
router.put("/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["EMPLOYEE", "DEPARTMENT_HEAD", "ASSET_MANAGER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be EMPLOYEE, DEPARTMENT_HEAD, or ASSET_MANAGER",
      });
    }

    // Prevent changing your own role
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't allow demoting another admin
    if (user.role === "ADMIN") {
      return res.status(400).json({ error: "Cannot change the role of another Admin" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/employees/:id/department
router.put("/:id/department", async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        return res.status(404).json({ error: "Department not found" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { departmentId: departmentId || null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Update department error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/employees/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ error: "Status must be ACTIVE or INACTIVE" });
    }

    // Prevent self-deactivation
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot deactivate yourself" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Toggle status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
