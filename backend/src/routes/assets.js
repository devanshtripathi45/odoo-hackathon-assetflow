const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const assetManagerOrAdmin = require("../middleware/assetManagerOrAdmin");

const router = express.Router();
const prisma = new PrismaClient();

// File upload config
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// All asset routes require auth
router.use(auth);

// Helper: generate next asset tag
async function generateAssetTag() {
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { assetTag: "desc" },
    select: { assetTag: true },
  });
  const nextNum = lastAsset ? parseInt(lastAsset.assetTag.split("-")[1]) + 1 : 1;
  return `AF-${String(nextNum).padStart(4, "0")}`;
}

// GET /api/assets — list with search/filter (all authenticated users)
router.get("/", async (req, res) => {
  try {
    const { search, category, status, location } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { assetTag: { contains: search } },
        { name: { contains: search } },
        { serialNumber: { contains: search } },
      ];
    }
    if (category) where.categoryId = category;
    if (status) where.status = status;
    if (location) where.location = { contains: location };

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { assetTag: "asc" },
    });

    res.json(assets);
  } catch (err) {
    console.error("Get assets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/assets/categories — get categories for dropdown (all users)
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.json(categories);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/assets/:id — single asset detail (all users)
router.get("/:id", async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        allocationHistory: { orderBy: { createdAt: "desc" } },
        maintenanceHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(asset);
  } catch (err) {
    console.error("Get asset detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/assets — register new asset (Admin/Asset Manager only)
router.post(
  "/",
  assetManagerOrAdmin,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name, categoryId, serialNumber, acquisitionDate,
        acquisitionCost, condition, location, isBookable,
      } = req.body;

      if (!name || !categoryId) {
        return res.status(400).json({ error: "Name and category are required" });
      }

      const cat = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
      if (!cat) {
        return res.status(404).json({ error: "Category not found" });
      }

      const assetTag = await generateAssetTag();

      const asset = await prisma.asset.create({
        data: {
          assetTag,
          name,
          categoryId,
          serialNumber: serialNumber || null,
          acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
          acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : null,
          condition: condition || "NEW",
          location: location || null,
          isBookable: isBookable === "true" || isBookable === true,
          status: "AVAILABLE",
          photoPath: req.files?.photo?.[0]?.filename || null,
          documentPath: req.files?.document?.[0]?.filename || null,
          createdById: req.user.id,
        },
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(asset);
    } catch (err) {
      console.error("Create asset error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/assets/:id — update asset (Admin/Asset Manager only)
router.put(
  "/:id",
  assetManagerOrAdmin,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await prisma.asset.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Asset not found" });
      }

      const {
        name, categoryId, serialNumber, acquisitionDate,
        acquisitionCost, condition, location, isBookable, status,
      } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (serialNumber !== undefined) updateData.serialNumber = serialNumber || null;
      if (acquisitionDate !== undefined) updateData.acquisitionDate = acquisitionDate ? new Date(acquisitionDate) : null;
      if (acquisitionCost !== undefined) updateData.acquisitionCost = acquisitionCost ? parseFloat(acquisitionCost) : null;
      if (condition !== undefined) updateData.condition = condition;
      if (location !== undefined) updateData.location = location || null;
      if (isBookable !== undefined) updateData.isBookable = isBookable === "true" || isBookable === true;
      if (status !== undefined) updateData.status = status;
      if (req.files?.photo?.[0]) updateData.photoPath = req.files.photo[0].filename;
      if (req.files?.document?.[0]) updateData.documentPath = req.files.document[0].filename;

      const asset = await prisma.asset.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          createdBy: { select: { id: true, name: true, email: true } },
          allocationHistory: { orderBy: { createdAt: "desc" } },
          maintenanceHistory: { orderBy: { createdAt: "desc" } },
        },
      });

      res.json(asset);
    } catch (err) {
      console.error("Update asset error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
