import { prisma } from "../shared/prisma";

export const seedInterestCategories = async () => {
  const interestData = [
    { name: "Sports & Fitness" },
    { name: "Technology & Coding" },
    { name: "Music & Concerts" },
    { name: "Food & Dining" },
    { name: "Art & Culture" },
    { name: "Travel & Outdoors" },
    { name: "Gaming & Esports" },
    { name: "Health & Wellness" },
    { name: "Education & Learning" },
    { name: "Networking & Business" },
  ];
  try {
    await prisma.interest.createMany({
      data: interestData,
      skipDuplicates: true,
    });

    console.log("✅ Interests seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};
