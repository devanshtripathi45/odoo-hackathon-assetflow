const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();
const prisma = new PrismaClient();

// All category routes require auth + admin
router.use(auth, adminOnly);

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
    });

    // Parse customFields JSON strings
    const parsed = categories.map((c) => ({
      ...c,
      customFields: typeof c.customFields === "string" ? JSON.parse(c.customFields) : c.customFields,
    }));

    res.json(parsed);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/categories
router.post("/", async (req, res) => {
  try {
    const { name, description, customFields } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const existing = await prisma.assetCategory.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    const category = await prisma.assetCategory.create({
      data: {
        name,
        description: description || null,
        customFields: customFields ? JSON.stringify(customFields) : "[]",
        status: "ACTIVE",
      },
    });

    res.status(201).json({
      ...category,
      customFields: typeof category.customFields === "string"
        ? JSON.parse(category.customFields)
        : category.customFields,
    });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/categories/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, customFields, status } = req.body;

    const cat = await prisma.assetCategory.findUnique({ where: { id } });
    if (!cat) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = await prisma.assetCategory.update({
      where: { id },
      data: {
        name: name ?? cat.name,
        description: description !== undefined ? description : cat.description,
        customFields: customFields ? JSON.stringify(customFields) : cat.customFields,
        status: status ?? cat.status,
      },
    });

    res.json({
      ...category,
      customFields: typeof category.customFields === "string"
        ? JSON.parse(category.customFields)
        : category.customFields,
    });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
