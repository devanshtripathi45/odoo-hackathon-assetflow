const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding AssetFlow database...\n");

  // Clear existing data (order matters for foreign keys)
  await prisma.booking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.maintenanceHistory.deleteMany();
  await prisma.allocationHistory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.assetCategory.deleteMany();

  // 1. Create departments
  const engineering = await prisma.department.create({
    data: { name: "Engineering", status: "ACTIVE" },
  });
  const marketing = await prisma.department.create({
    data: { name: "Marketing", status: "ACTIVE" },
  });
  const operations = await prisma.department.create({
    data: { name: "Operations", status: "ACTIVE" },
  });
  console.log("✅ Departments created: Engineering, Marketing, Operations");

  // 2. Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@assetflow.com",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      departmentId: engineering.id,
    },
  });
  console.log("✅ Admin created: admin@assetflow.com / admin123");

  // 3. Create sample employees
  const empPassword = await bcrypt.hash("password123", 10);

  const ravi = await prisma.user.create({
    data: { name: "Ravi Sharma", email: "ravi@assetflow.com", password: empPassword, role: "EMPLOYEE", status: "ACTIVE", departmentId: engineering.id },
  });
  const priya = await prisma.user.create({
    data: { name: "Priya Patel", email: "priya@assetflow.com", password: empPassword, role: "EMPLOYEE", status: "ACTIVE", departmentId: marketing.id },
  });
  const ankit = await prisma.user.create({
    data: { name: "Ankit Verma", email: "ankit@assetflow.com", password: empPassword, role: "EMPLOYEE", status: "ACTIVE", departmentId: operations.id },
  });
  const sneha = await prisma.user.create({
    data: { name: "Sneha Gupta", email: "sneha@assetflow.com", password: empPassword, role: "EMPLOYEE", status: "ACTIVE", departmentId: engineering.id },
  });
  console.log("✅ Employees created: Ravi, Priya, Ankit, Sneha (password: password123)");

  // 4. Create asset categories
  const electronics = await prisma.assetCategory.create({
    data: {
      name: "Electronics",
      description: "Laptops, monitors, phones, and other electronic equipment",
      customFields: JSON.stringify([
        { name: "Warranty Period", type: "text" },
        { name: "Serial Number", type: "text" },
      ]),
      status: "ACTIVE",
    },
  });
  const furniture = await prisma.assetCategory.create({
    data: {
      name: "Furniture",
      description: "Desks, chairs, cabinets, and office furniture",
      customFields: JSON.stringify([
        { name: "Material", type: "text" },
        { name: "Color", type: "text" },
      ]),
      status: "ACTIVE",
    },
  });
  const vehicles = await prisma.assetCategory.create({
    data: {
      name: "Vehicles",
      description: "Company cars, vans, and transport vehicles",
      customFields: JSON.stringify([
        { name: "License Plate", type: "text" },
        { name: "Insurance Expiry", type: "date" },
      ]),
      status: "ACTIVE",
    },
  });
  console.log("✅ Asset Categories created: Electronics, Furniture, Vehicles");

  // 5. Create sample assets
  const assets = [
    { assetTag: "AF-0001", name: "MacBook Pro 16\"", categoryId: electronics.id, serialNumber: "MBP-2025-001", acquisitionDate: new Date("2025-01-15"), acquisitionCost: 2499.00, condition: "GOOD", location: "Floor 3, Desk 12", isBookable: false, status: "AVAILABLE" },
    { assetTag: "AF-0002", name: "Dell UltraSharp 27\" Monitor", categoryId: electronics.id, serialNumber: "DLL-MON-042", acquisitionDate: new Date("2025-03-10"), acquisitionCost: 549.00, condition: "NEW", location: "Floor 3, Desk 12", isBookable: false, status: "AVAILABLE" },
    { assetTag: "AF-0003", name: "iPhone 16 Pro", categoryId: electronics.id, serialNumber: "APL-IP16-089", acquisitionDate: new Date("2025-06-01"), acquisitionCost: 1199.00, condition: "NEW", location: "IT Store Room", isBookable: false, status: "AVAILABLE" },
    { assetTag: "AF-0004", name: "Herman Miller Aeron Chair", categoryId: furniture.id, serialNumber: "HM-AERON-115", acquisitionDate: new Date("2024-08-20"), acquisitionCost: 1395.00, condition: "GOOD", location: "Floor 2, Meeting Room A", isBookable: false, status: "AVAILABLE" },
    { assetTag: "AF-0005", name: "Standing Desk - Electric", categoryId: furniture.id, serialNumber: "SD-ELEC-203", acquisitionDate: new Date("2024-11-05"), acquisitionCost: 799.00, condition: "GOOD", location: "Floor 3, Desk 8", isBookable: false, status: "AVAILABLE" },
    { assetTag: "AF-0006", name: "Toyota Innova Crysta", categoryId: vehicles.id, serialNumber: "MH-12-AB-1234", acquisitionDate: new Date("2023-06-15"), acquisitionCost: 24500.00, condition: "FAIR", location: "Basement Parking B1", isBookable: true, status: "AVAILABLE" },
    { assetTag: "AF-0007", name: "ThinkPad X1 Carbon", categoryId: electronics.id, serialNumber: "LNV-X1C-667", acquisitionDate: new Date("2024-02-28"), acquisitionCost: 1849.00, condition: "POOR", location: "IT Service Desk", isBookable: false, status: "UNDER_MAINTENANCE" },
    { assetTag: "AF-0008", name: "Conference Table - 12 Seater", categoryId: furniture.id, serialNumber: "CT-12S-001", acquisitionDate: new Date("2022-01-10"), acquisitionCost: 2200.00, condition: "GOOD", location: "Floor 5, Board Room", isBookable: true, status: "AVAILABLE" },
    { assetTag: "AF-0009", name: "HP LaserJet Pro Printer", categoryId: electronics.id, serialNumber: "HP-LJ-PRO-445", acquisitionDate: new Date("2021-09-20"), acquisitionCost: 450.00, condition: "DAMAGED", location: "Storage", isBookable: false, status: "RETIRED" },
    { assetTag: "AF-0010", name: "Maruti Suzuki Ertiga", categoryId: vehicles.id, serialNumber: "MH-04-CD-5678", acquisitionDate: new Date("2024-01-10"), acquisitionCost: 12500.00, condition: "GOOD", location: "Basement Parking B2", isBookable: true, status: "UNDER_MAINTENANCE" },
  ];

  for (const asset of assets) {
    await prisma.asset.create({
      data: { ...asset, createdById: admin.id },
    });
  }
  console.log("✅ Assets created: 10 sample assets (AF-0001 to AF-0010)");

  // 6. Create sample bookings (Phase 4)
  // Fetch bookable assets to link them
  const innova = await prisma.asset.findUnique({ where: { assetTag: "AF-0006" } });
  const confTable = await prisma.asset.findUnique({ where: { assetTag: "AF-0008" } });

  if (innova && confTable) {
    const now = new Date();
    
    // Ongoing booking (started 1 hour ago, ends in 1 hour)
    const ongoingStart = new Date(now.getTime() - 60 * 60 * 1000);
    const ongoingEnd = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Upcoming booking (starts tomorrow at 10 AM, ends at 12 PM)
    const upcomingDate = new Date(now);
    upcomingDate.setDate(upcomingDate.getDate() + 1);
    const upcomingStart = new Date(upcomingDate.setHours(10, 0, 0, 0));
    const upcomingEnd = new Date(upcomingDate.setHours(12, 0, 0, 0));

    // Past booking (yesterday)
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 1);
    const pastStart = new Date(pastDate.setHours(14, 0, 0, 0));
    const pastEnd = new Date(pastDate.setHours(16, 0, 0, 0));

    await prisma.booking.createMany({
      data: [
        {
          assetId: innova.id,
          userId: ravi.id,
          date: new Date(now.setHours(0, 0, 0, 0)),
          startTime: ongoingStart,
          endTime: ongoingEnd,
          purpose: "Client meeting transport",
        },
        {
          assetId: confTable.id,
          userId: priya.id,
          date: new Date(upcomingDate.setHours(0, 0, 0, 0)),
          startTime: upcomingStart,
          endTime: upcomingEnd,
          purpose: "Marketing Team Sync",
          isDepartment: true,
        },
        {
          assetId: innova.id,
          userId: ankit.id,
          date: new Date(pastDate.setHours(0, 0, 0, 0)),
          startTime: pastStart,
          endTime: pastEnd,
          purpose: "Site Visit",
        }
      ]
    });
    console.log("✅ Bookings created: 3 sample bookings (Ongoing, Upcoming, Completed)");
  }

  console.log("\n🎉 Seed complete! You can now log in as admin@assetflow.com / admin123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
