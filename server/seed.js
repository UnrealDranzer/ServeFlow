import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting onboarding for Bangalore Benne Dose...");

  // 1. Setup Business and Owner details
  const businessSlug = "bangalore-benne-dose";
  const ownerEmail = "owner@bangalorebennedose.com";
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  // Upsert Business
  const business = await prisma.business.upsert({
    where: { slug: businessSlug },
    update: {
      name: "Bangalore Benne Dose",
      businessType: "CAFE",
      ownerName: "Adarsh",
      email: ownerEmail,
      phone: "9876543210",
      currency: "INR",
      orderMode: "BOTH",
      isActive: true,
    },
    create: {
      name: "Bangalore Benne Dose",
      slug: businessSlug,
      businessType: "CAFE",
      ownerName: "Adarsh",
      email: ownerEmail,
      phone: "9876543210",
      currency: "INR",
      orderMode: "BOTH",
      isActive: true,
      settings: {
        create: {
          acceptingOrders: true,
          showImages: true,
          showItemDescription: true,
          showVegBadge: true,
          timezone: "Asia/Kolkata",
        },
      },
    },
  });

  console.log(`- Business ensured: ${business.name} (${business.id})`);

  // 2. Setup Owner User
  await prisma.user.upsert({
    where: {
      businessId_email: {
        businessId: business.id,
        email: ownerEmail,
      },
    },
    update: {
      name: "Adarsh",
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
    create: {
      businessId: business.id,
      name: "Adarsh",
      email: ownerEmail,
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
  });

  console.log("- Owner user ensured.");

  // 3. Define Menu Structure
  const menuData = [
    {
      category: "Idly",
      items: [
        { name: "Idly Single", price: 25 },
        { name: "Idly Double", price: 45 },
        { name: "Dal Vada", price: 25 },
        { name: "Medu Vada", price: 35 },
        { name: "Single Idly Vada", price: 55 },
        { name: "Double Idly Vada", price: 85 },
        { name: "Thatte Idly", price: 50 },
        { name: "Ghee Podi Thatte Idly", price: 65 },
        { name: "Ghee Podi Mini Idly", price: 80 },
        { name: "Ghee Sambar Mini Idly", price: 90 },
        { name: "Rasam Idly", price: 90 },
      ],
    },
    {
      category: "Benne Dosa",
      items: [
        { name: "Plain Dosa", price: 70 },
        { name: "Ghee Podi Dosa", price: 90 },
        { name: "Ghee Masala Dosa", price: 110 },
        { name: "Podi Ghee Masala Dosa", price: 120 },
        { name: "Open Butter Masala Dosa", price: 120 },
        { name: "Onion Dosa", price: 100 },
        { name: "Set Dosa", price: 100 },
        { name: "Jain Masala Dosa (Jain Sambar)", price: 120 },
        { name: "Cheese Masala Dosa", price: 140 },
        { name: "Paneer Cheese Masala Dosa", price: 160 },
      ],
    },
    {
      category: "Beverage",
      items: [
        { name: "Tea", price: 15 },
        { name: "Filter Coffee", price: 25 },
        { name: "Lemon Tea", price: 20 },
        { name: "Iced Filter Coffee", price: 50 },
        { name: "Hot Horlicks", price: 40 },
        { name: "Iced Horlicks", price: 60 },
        { name: "Hot Boost", price: 40 },
        { name: "Iced Boost", price: 60 },
        { name: "Hot Bournvita", price: 40 },
        { name: "Iced Bournvita", price: 60 },
        { name: "Water Bottle (500 ml)", price: 10 },
      ],
    },
    {
      category: "Other Delicacy",
      items: [
        { name: "Poori Bhaji (2 pcs)", price: 80 },
        { name: "Mangalore Buns (1 pc)", price: 50 },
        { name: "Rasam Bonda (2 pcs)", price: 60 },
        { name: "Mirchi Bhaji (2 pcs)", price: 65 },
        { name: "Aloo Appe (6 pcs)", price: 80 },
      ],
    },
    {
      category: "Lunch",
      items: [
        { name: "Ghee Sambar Rice", price: 95 },
        { name: "Tomato Rice", price: 85 },
        { name: "Lemon Rice", price: 85 },
        { name: "Ghee Podi Rice (Hand Tossed)", price: 105 },
        { name: "Extra Ghee / Butter", price: 15 },
      ],
    },
  ];

  // 4. Create Categories and Items
  for (const group of menuData) {
    let category = await prisma.category.findFirst({
      where: { name: group.category, businessId: business.id },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: group.category,
          businessId: business.id,
          isActive: true,
        },
      });
    }

    console.log(`- Category ensured: ${category.name}`);

    for (const item of group.items) {
      // Find existing item by name within the same category/business to ensure idempotency
      const existingItem = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id, businessId: business.id },
        select: { id: true }
      });

      if (existingItem) {
        await prisma.menuItem.update({
          where: { id_businessId: { id: existingItem.id, businessId: business.id } },
          data: {
            price: item.price,
            isAvailable: true,
            isVeg: true,
          }
        });
      } else {
        await prisma.menuItem.create({
          data: {
            name: item.name,
            price: item.price,
            categoryId: category.id,
            businessId: business.id,
            isAvailable: true,
            isVeg: true,
          }
        });
      }
    }
  }

  console.log("- Menu items ensured.");

  // 5. Setup Order Sources
  const sources = [
    { name: "Table 1", slug: "table-1", type: "TABLE" },
    { name: "Table 2", slug: "table-2", type: "TABLE" },
    { name: "Table 3", slug: "table-3", type: "TABLE" },
    { name: "Table 4", slug: "table-4", type: "TABLE" },
    { name: "Counter", slug: "counter", type: "COUNTER" },
    { name: "Takeaway", slug: "takeaway", type: "TAKEAWAY" },
  ];

  for (const source of sources) {
    await prisma.orderSource.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: source.slug,
        },
      },
      update: {
        name: source.name,
        sourceType: source.type,
      },
      create: {
        businessId: business.id,
        name: source.name,
        slug: source.slug,
        sourceType: source.type,
        isActive: true,
      },
    });
  }

  console.log("- Order sources ensured.");
  console.log("Onboarding completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
