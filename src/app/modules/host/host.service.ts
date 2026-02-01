import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { prisma } from "../../shared/prisma";
import { userSearchableFields } from "../user/user.constant";

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

const getAllHost = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filtersData } = params;

  const andConditions: any[] = [];

  // 🔒 Mandatory condition: only HOST users
  andConditions.push({
    role: "HOST",
  });

  // 🔍 Search
  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // 🎛 Dynamic filters
  if (Object.keys(filtersData).length > 0) {
    andConditions.push({
      AND: Object.keys(filtersData).map((key) => ({
        [key]: {
          equals: (filtersData as any)[key],
        },
      })),
    });
  }

  const whereConditions = {
    AND: andConditions,
  };

  const result = await prisma.user.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: sortBy
      ? {
          [sortBy]: sortOrder,
        }
      : undefined,
    include: {
      profile: true,
      userInterests: true,
      eventParticipants: true,
      events: true,
      payments: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getHostSummary = async (hostId: string) => {
  const totalEvents = await prisma.event.count({
    where: { hostId },
  });

  const activeEvents = await prisma.event.count({
    where: {
      hostId,
      date: { gte: new Date() },
    },
  });

  const totalParticipants = await prisma.eventParticipant.count({
    where: {
      event: {
        hostId,
      },
    },
  });

  return {
    totalEvents,
    activeEvents,
    totalParticipants,
  };
};

const getHostUpcomingEvents = async (hostId: string) => {
  return prisma.event.findMany({
    where: {
      hostId,
      date: { gte: new Date() },
    },
    include: {
      eventParticipants: true,
    },
    orderBy: { date: "asc" },
    take: 5,
  });
};
const getHostRecentParticipants = async (hostId: string) => {
  return prisma.eventParticipant.findMany({
    where: {
      event: { hostId },
    },
    include: {
      user: {
        include: { profile: true },
      },
      event: true,
    },
    orderBy: { joinedAt: "desc" },
    take: 5,
  });
};

export const HostService = {
  getTopRatedHosts,
  getAllHost,
  getHostSummary,
  getHostUpcomingEvents,
  getHostRecentParticipants,
};
