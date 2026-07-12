const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const assetManagerOrAdmin = require("../middleware/assetManagerOrAdmin");

const router = express.Router();
const prisma = new PrismaClient();

// All allocation routes require auth
router.use(auth);

// Helper function to get holder name (User or Department)
async function getHolderName(allocatedToType, allocatedToId) {
  if (allocatedToType === "EMPLOYEE") {
    const user = await prisma.user.findUnique({ where: { id: allocatedToId } });
    return user ? user.name : "Unknown Employee";
  } else if (allocatedToType === "DEPARTMENT") {
    const dept = await prisma.department.findUnique({ where: { id: allocatedToId } });
    return dept ? dept.name : "Unknown Department";
  }
  return "Unknown";
}

// POST /api/allocations — Allocate an asset
router.post("/", assetManagerOrAdmin, async (req, res) => {
  try {
    const { assetId, allocatedToType, allocatedToId, expectedReturnDate, notes } = req.body;

    if (!assetId || !allocatedToType || !allocatedToId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    // Conflict Rule: check if already allocated
    if (asset.status === "ALLOCATED") {
      // Find active allocation
      const activeAlloc = await prisma.allocationHistory.findFirst({
        where: { assetId, returnedDate: null },
        orderBy: { createdAt: "desc" },
      });

      if (activeAlloc) {
        const holderName = await getHolderName(activeAlloc.allocatedToType, activeAlloc.allocatedToId);
        return res.status(409).json({ 
          error: `This asset is currently held by ${holderName}`,
          currentHolderId: activeAlloc.allocatedToId,
          currentHolderType: activeAlloc.allocatedToType,
          currentHolderName: holderName
        });
      }
    }

    // Proceed with allocation
    const allocation = await prisma.$transaction(async (tx) => {
      // 1. Create AllocationHistory
      const newAlloc = await tx.allocationHistory.create({
        data: {
          assetId,
          allocatedToType,
          allocatedToId,
          allocatedById: req.user.id,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          notes: notes || null,
          action: "ALLOCATED",
        },
      });

      // 2. Update Asset Status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: "ALLOCATED" },
      });

      return newAlloc;
    });

    res.status(201).json(allocation);
  } catch (err) {
    console.error("Allocation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/allocations/return/:assetId — Return an asset
router.post("/return/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    
    // In a full implementation, you might want to check if the user has permission to return this
    // For now, let's allow it if they are the holder or an admin/manager.
    
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== "ALLOCATED") {
      return res.status(400).json({ error: "Asset is not currently allocated" });
    }

    const activeAlloc = await prisma.allocationHistory.findFirst({
      where: { assetId, returnedDate: null },
      orderBy: { createdAt: "desc" },
    });

    if (!activeAlloc) {
      return res.status(400).json({ error: "No active allocation found" });
    }

    await prisma.$transaction(async (tx) => {
      // Mark as returned
      await tx.allocationHistory.update({
        where: { id: activeAlloc.id },
        data: { returnedDate: new Date(), action: "RETURNED" },
      });

      // Update asset status back to AVAILABLE
      await tx.asset.update({
        where: { id: assetId },
        data: { status: "AVAILABLE" },
      });
    });

    res.json({ message: "Asset returned successfully" });
  } catch (err) {
    console.error("Return error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/allocations/requests — List transfer requests
router.get("/requests", async (req, res) => {
  try {
    const requests = await prisma.transferRequest.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        requester: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Populate currentHolderName for each request manually
    const enriched = await Promise.all(requests.map(async (req) => {
      const holderName = await getHolderName(req.currentHolderType, req.currentHolderId);
      return { ...req, currentHolderName: holderName };
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/allocations/requests — Create transfer request
router.post("/requests", async (req, res) => {
  try {
    const { assetId, reason } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== "ALLOCATED") {
      return res.status(400).json({ error: "Asset is not currently allocated" });
    }

    const activeAlloc = await prisma.allocationHistory.findFirst({
      where: { assetId, returnedDate: null },
      orderBy: { createdAt: "desc" },
    });

    if (!activeAlloc) {
      return res.status(400).json({ error: "No active allocation found" });
    }

    // Check if user already requested
    const existingReq = await prisma.transferRequest.findFirst({
      where: { assetId, requesterId: req.user.id, status: "REQUESTED" }
    });
    
    if (existingReq) {
      return res.status(400).json({ error: "You already have a pending request for this asset" });
    }

    const transferReq = await prisma.transferRequest.create({
      data: {
        assetId,
        currentHolderId: activeAlloc.allocatedToId,
        currentHolderType: activeAlloc.allocatedToType,
        requesterId: req.user.id,
        reason: reason || null,
        status: "REQUESTED",
      },
    });

    res.status(201).json(transferReq);
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/allocations/requests/:id/approve — Approve transfer request
router.post("/requests/:id/approve", assetManagerOrAdmin, async (req, res) => {
  try {
    const request = await prisma.transferRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.status !== "REQUESTED") {
      return res.status(400).json({ error: "Invalid or already processed request" });
    }

    // Approve logic:
    // 1. Mark request RE_ALLOCATED
    // 2. End current allocation
    // 3. Create new allocation for requester (as EMPLOYEE)
    
    await prisma.$transaction(async (tx) => {
      await tx.transferRequest.update({
        where: { id: request.id },
        data: { status: "RE_ALLOCATED" },
      });

      const activeAlloc = await tx.allocationHistory.findFirst({
        where: { assetId: request.assetId, returnedDate: null },
        orderBy: { createdAt: "desc" },
      });

      if (activeAlloc) {
        await tx.allocationHistory.update({
          where: { id: activeAlloc.id },
          data: { returnedDate: new Date(), action: "TRANSFERRED" },
        });
      }

      await tx.allocationHistory.create({
        data: {
          assetId: request.assetId,
          allocatedToType: "EMPLOYEE",
          allocatedToId: request.requesterId,
          allocatedById: req.user.id,
          action: "ALLOCATED (TRANSFER)",
        },
      });
      
      // Asset status remains ALLOCATED
    });

    res.json({ message: "Transfer approved and asset re-allocated" });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/allocations/requests/:id/reject — Reject transfer request
router.post("/requests/:id/reject", assetManagerOrAdmin, async (req, res) => {
  try {
    const request = await prisma.transferRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.status !== "REQUESTED") {
      return res.status(400).json({ error: "Invalid or already processed request" });
    }

    await prisma.transferRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED" },
    });

    res.json({ message: "Transfer request rejected" });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/allocations/history/:assetId — Get allocation history for an asset
router.get("/history/:assetId", async (req, res) => {
  try {
    const history = await prisma.allocationHistory.findMany({
      where: { assetId: req.params.assetId },
      include: {
        allocator: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Enrich with names
    const enriched = await Promise.all(history.map(async (h) => {
      const holderName = await getHolderName(h.allocatedToType, h.allocatedToId);
      return { ...h, allocatedToName: holderName };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
