const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();
const prisma = new PrismaClient();

// All department routes require auth + admin
router.use(auth, adminOnly);

// GET /api/departments
router.get("/", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (err) {
    console.error("Get departments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/departments
router.post("/", async (req, res) => {
  try {
    const { name, headId, parentId, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Department name is required" });
    }

    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Department name already exists" });
    }

    const department = await prisma.department.create({
      data: {
        name,
        headId: headId || null,
        parentId: parentId || null,
        status: status || "ACTIVE",
      },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    res.status(201).json(department);
  } catch (err) {
    console.error("Create department error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/departments/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, headId, parentId, status } = req.body;

    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Prevent self-referencing parent
    if (parentId === id) {
      return res.status(400).json({ error: "Department cannot be its own parent" });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name ?? dept.name,
        headId: headId !== undefined ? (headId || null) : dept.headId,
        parentId: parentId !== undefined ? (parentId || null) : dept.parentId,
        status: status ?? dept.status,
      },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    res.json(department);
  } catch (err) {
    console.error("Update department error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/departments/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ error: "Status must be ACTIVE or INACTIVE" });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { status },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    res.json(department);
  } catch (err) {
    console.error("Toggle department status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
