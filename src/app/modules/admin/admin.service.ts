import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { prisma } from "../../shared/prisma";

const getDashboardOverview = async () => {
  const totalUsers = await prisma.user.count();

  const totalHosts = await prisma.user.count({
    where: {
      role: "HOST",
    },
  });

  const totalEvents = await prisma.event.count();

  const upcomingEvents = await prisma.event.count({
    where: {
      date: {
        gt: new Date(),
      },
      status: "OPEN",
    },
  });

  return {
    totalUsers,
    totalHosts,
    totalEvents,
    upcomingEvents,
  };
};

const getRecentUsers = async (options: IOptions) => {
  const { limit } = paginationHelper.calculatePagination(options);

  const result = await prisma.user.findMany({
    take: limit || 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      profile: true,
    },
  });

  return result;
};

const getRecentEvents = async (options: IOptions) => {
  const { limit } = paginationHelper.calculatePagination(options);
  const result = await prisma.event.findMany({
    take: limit || 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      host: {
        include: {
          profile: true,
        },
      },
    },
  });

  return result;
};

export const AdminService = {
  getDashboardOverview,
  getRecentUsers,
  getRecentEvents,
};
