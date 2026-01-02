import { prisma } from "../../shared/prisma";

const getTopRatedHosts = async (limit = 5) => {
  const hosts = await prisma.user.findMany({
    where: {
      role: { in: ["HOST", "ADMIN"] },
    },
    include: {
      profile: true,
      events: {
        include: {
          reviews: true,
        },
      },
    },
  });

  const formatted = hosts
    .map((host) => {
      const allReviews = host.events.flatMap((event) => event.reviews);

      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      return {
        id: host.id,
        name: host.profile?.fullName ?? "Unknown Host",
        avatar: host.profile?.image ?? null,
        rating: Number(avgRating.toFixed(1)),
        events: host.events.length,
        initials:
          host.profile?.fullName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2) ?? "H",
      };
    })
    .filter((h) => h.events > 0) // optional
    .sort((a, b) => b.rating - a.rating || b.events - a.events)
    .slice(0, limit);

  return formatted;
};

export const HostService = {
  getTopRatedHosts,
};
