const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding AssetFlow database...\n");

  // Clear existing data
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

  await prisma.user.create({
    data: {
      name: "Ravi Sharma",
      email: "ravi@assetflow.com",
      password: empPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: engineering.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya@assetflow.com",
      password: empPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: marketing.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Ankit Verma",
      email: "ankit@assetflow.com",
      password: empPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: operations.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Sneha Gupta",
      email: "sneha@assetflow.com",
      password: empPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: engineering.id,
    },
  });

  console.log("✅ Employees created: Ravi, Priya, Ankit, Sneha (password: password123)");

  // 4. Create asset categories
  await prisma.assetCategory.create({
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

  await prisma.assetCategory.create({
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

  await prisma.assetCategory.create({
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
