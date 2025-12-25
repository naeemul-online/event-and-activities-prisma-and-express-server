import { prisma } from "../shared/prisma";

export const seedEventsCategories = async () => {
  const categoriesData = [
    {
      name: "Music",
    },
    {
      name: "Sports",
    },
    {
      name: "Food & Drink",
    },
    {
      name: "Technology",
    },
    {
      name: "Arts & Culture",
    },
    {
      name: "Fitness",
    },
    {
      name: "Outdoor Adventures",
    },
    {
      name: "Networking",
    },
    {
      name: "Conferences",
    },
    {
      name: "Charity & Volunteering",
    },
  ];

  try {
    await prisma.category.createMany({
      data: categoriesData,
      skipDuplicates: true,
    });

    console.log("✅ Event categories seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};
