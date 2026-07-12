const express = require("express");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/stats", async (req, res) => {
  try {
    const { role, id: userId, departmentId } = req.user;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // If Employee, return simplified specific arrays
    if (role === "EMPLOYEE") {
      const myAllocations = await prisma.allocationHistory.findMany({
        where: { 
          allocatedToType: "EMPLOYEE", 
          allocatedToId: userId, 
          returnedDate: null 
        },
        include: { asset: { select: { name: true, assetTag: true } } }
      });

      const myBookings = await prisma.booking.findMany({
        where: { 
          userId, 
          isCancelled: false, 
          endTime: { gt: now } 
        },
        include: { asset: { select: { name: true, assetTag: true } } },
        orderBy: { startTime: "asc" }
      });

      return res.json({
        type: "EMPLOYEE",
        data: {
          myAllocations,
          myBookings,
          myOverdueReturns: myAllocations.filter(a => a.expectedReturnDate && new Date(a.expectedReturnDate) < now)
        }
      });
    }

    // Determine filter constraints for Dept Head
    let userFilter = {}; // Used for bookings & employee allocations
    let deptFilter = {}; // Used for department allocations

    if (role === "DEPARTMENT_HEAD" && departmentId) {
      const members = await prisma.user.findMany({
        where: { departmentId },
        select: { id: true }
      });
      const memberIds = members.map(m => m.id);
      
      userFilter = { in: memberIds };
      deptFilter = departmentId;
    }

    // 1. Assets Available (Org-wide for everyone)
    const availableAssets = await prisma.asset.count({
      where: { status: "AVAILABLE" }
    });

    // 2. Assets Allocated
    let allocatedWhere = { returnedDate: null };
    if (role === "DEPARTMENT_HEAD") {
      allocatedWhere.OR = [
        { allocatedToType: "DEPARTMENT", allocatedToId: deptFilter },
        { allocatedToType: "EMPLOYEE", allocatedToId: userFilter }
      ];
    }
    const allocatedAssets = await prisma.allocationHistory.count({ where: allocatedWhere });

    // 3. Active Bookings
    let bookingWhere = { isCancelled: false, endTime: { gt: now } };
    if (role === "DEPARTMENT_HEAD") {
      bookingWhere.userId = userFilter;
    }
    const activeBookings = await prisma.booking.count({ where: bookingWhere });

    // 4. Pending Transfers
    let transferWhere = { status: "REQUESTED" };
    if (role === "DEPARTMENT_HEAD") {
      transferWhere.OR = [
        { currentHolderType: "DEPARTMENT", currentHolderId: deptFilter },
        { currentHolderType: "EMPLOYEE", currentHolderId: userFilter },
        { requesterId: userFilter }
      ];
    }
    const pendingTransfers = await prisma.transferRequest.count({ where: transferWhere });

    // 5. Overdue and Upcoming Returns logic
    // We fetch the actual records to display them in the sections, and just count the upcoming ones.
    let returnsWhere = { returnedDate: null, expectedReturnDate: { not: null } };
    if (role === "DEPARTMENT_HEAD") {
      returnsWhere.OR = [
        { allocatedToType: "DEPARTMENT", allocatedToId: deptFilter },
        { allocatedToType: "EMPLOYEE", allocatedToId: userFilter }
      ];
    }

    const allReturns = await prisma.allocationHistory.findMany({
      where: returnsWhere,
      include: { asset: { select: { name: true, assetTag: true } } }
    });

    const overdueReturnsRaw = allReturns.filter(a => new Date(a.expectedReturnDate) < now);
    const upcomingReturnsRaw = allReturns.filter(a => {
      const d = new Date(a.expectedReturnDate);
      return d >= now && d <= sevenDaysFromNow;
    });
    
    // Format overdue returns
    const overdueReturns = overdueReturnsRaw.map(a => {
      const diffTime = Math.abs(now - new Date(a.expectedReturnDate));
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...a, daysOverdue };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Format upcoming returns
    const upcomingReturns = upcomingReturnsRaw.map(a => {
      const diffTime = Math.abs(new Date(a.expectedReturnDate) - now);
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...a, daysUntil };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    // Helper to get names for the lists
    const enrichedOverdue = await Promise.all(overdueReturns.map(async (r) => {
      let holderName = "Unknown";
      if (r.allocatedToType === "EMPLOYEE") {
        const u = await prisma.user.findUnique({ where: { id: r.allocatedToId } });
        if (u) holderName = u.name;
      } else {
        const d = await prisma.department.findUnique({ where: { id: r.allocatedToId } });
        if (d) holderName = d.name;
      }
      return { ...r, holderName };
    }));

    const enrichedUpcoming = await Promise.all(upcomingReturns.map(async (r) => {
      let holderName = "Unknown";
      if (r.allocatedToType === "EMPLOYEE") {
        const u = await prisma.user.findUnique({ where: { id: r.allocatedToId } });
        if (u) holderName = u.name;
      } else {
        const d = await prisma.department.findUnique({ where: { id: r.allocatedToId } });
        if (d) holderName = d.name;
      }
      return { ...r, holderName };
    }));

    res.json({
      type: "MANAGER",
      data: {
        kpis: {
          assetsAvailable: availableAssets,
          assetsAllocated: allocatedAssets,
          activeBookings,
          pendingTransfers,
          upcomingReturnsCount: upcomingReturns.length,
          maintenanceToday: 0 // Static 0 as requested
        },
        overdueReturns: enrichedOverdue,
        upcomingReturns: enrichedUpcoming
      }
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
