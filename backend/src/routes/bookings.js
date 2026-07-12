const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");
const assetManagerOrAdmin = require("../middleware/assetManagerOrAdmin");

const router = express.Router();
const prisma = new PrismaClient();

// All booking routes require auth
router.use(auth);

// Helper function to format time (e.g., "9:00 AM")
const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
};

// GET /api/bookings/bookable-assets — Fetch assets available for booking
router.get("/bookable-assets", async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { 
        isBookable: true,
        status: { notIn: ["RETIRED", "DISPOSED", "LOST"] }
      },
      include: { category: true },
      orderBy: { name: "asc" }
    });
    res.json(assets);
  } catch (err) {
    console.error("Get bookable assets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bookings/my-bookings — Fetch logged-in user's bookings
router.get("/my-bookings", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { asset: true },
      orderBy: [
        { date: "desc" },
        { startTime: "desc" }
      ]
    });
    res.json(bookings);
  } catch (err) {
    console.error("Get my bookings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bookings/resource/:assetId — Fetch bookings for a specific resource
router.get("/resource/:assetId", async (req, res) => {
  try {
    const { date } = req.query;
    const where = {
      assetId: req.params.assetId,
      isCancelled: false
    };

    if (date) {
      // If date is provided, filter exactly by that date
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      where.date = queryDate;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { startTime: "asc" }
    });
    res.json(bookings);
  } catch (err) {
    console.error("Get resource bookings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/bookings/cancel/:id — Cancel a booking
router.post("/cancel/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only allow the booker or admin/manager to cancel
    if (booking.userId !== req.user.id && req.user.role !== "ADMIN" && req.user.role !== "ASSET_MANAGER") {
      return res.status(403).json({ error: "Not authorized to cancel this booking" });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { isCancelled: true }
    });

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/bookings — Create a new booking
router.post("/", async (req, res) => {
  try {
    const { assetId, date, startTime, endTime, purpose, isDepartment } = req.body;

    if (!assetId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0); // Normalize to midnight

    if (newEnd <= newStart) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    // Run overlap check and creation in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Verify Asset is bookable
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset || !asset.isBookable) {
        throw new Error("Asset is not bookable");
      }
      
      // 2. Overlap Validation
      // Two intervals overlap if Start A < End B AND End A > Start B
      // This allows back-to-back bookings where End A == Start B
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          assetId,
          date: bookingDate,
          isCancelled: false,
          AND: [
            { startTime: { lt: newEnd } },
            { endTime: { gt: newStart } }
          ]
        },
        include: { user: { select: { name: true } } }
      });

      if (conflictingBooking) {
        const error = new Error("CONFLICT");
        error.conflictDetails = {
          userName: conflictingBooking.user.name,
          start: formatTime(conflictingBooking.startTime),
          end: formatTime(conflictingBooking.endTime),
          assetName: asset.name
        };
        throw error;
      }

      // 3. Create Booking
      const newBooking = await tx.booking.create({
        data: {
          assetId,
          userId: req.user.id,
          date: bookingDate,
          startTime: newStart,
          endTime: newEnd,
          purpose: purpose || null,
          isDepartment: (isDepartment && req.user.role === "DEPARTMENT_HEAD") ? true : false
        }
      });

      return newBooking;
    });

    res.status(201).json(booking);
  } catch (err) {
    if (err.message === "CONFLICT") {
      const details = err.conflictDetails;
      return res.status(409).json({ 
        error: `${details.assetName} is already booked ${details.start}–${details.end} by ${details.userName}` 
      });
    }
    if (err.message === "Asset is not bookable") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
