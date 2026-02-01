import bcrypt from "bcryptjs";
import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import { userSearchableFields } from "./user.constant";

interface UpdateProfileInput {
  email?: string;
  password?: string;
  role?: string;
  profile?: {
    fullName?: string;
    bio?: string;
    image?: string;
    location?: string;
  };
}

const createUser = async (req: Request) => {
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.profile.image = uploadResult?.secure_url as string;
  }

  const { email, password, role, profile, interestIds } = req.body;

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tnx: any) => {
    const newUser = await tnx.user.create({
      data: {
        email,
        password: hashPassword,
        role: role || "USER",
      },
    });

    const newProfile = await tnx.profile.create({
      data: { ...profile, userId: newUser.id },
    });

    // interestIds is an array of interest IDs -> create entries in userInterests table ->

    if (interestIds && interestIds.length > 0) {
      const userInterestData = interestIds.map((interestId: number) => ({
        userId: newUser.id,
        interestId,
      }));

      const newInterestData = await tnx.userInterest.createMany({
        data: userInterestData,
        skipDuplicates: true,
      });

      return { ...newUser, profile: newProfile, interests: newInterestData };
    }

    return newUser;
  });

  return result;
};

const createInterest = async (req: Request) => {
  const interestData = req.body as { name: string }[];
  const result = await prisma.interest.createMany({
    data: interestData,
    skipDuplicates: true,
  });

  return result;
};

const getAllInterests = async (req: Request) => {
  const users = await prisma.interest.findMany();
  return users;
};

const getAllUser = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filtersData } = params;

  const andConditions = [];

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

  if (Object.keys(filtersData).length > 0) {
    andConditions.push({
      AND: Object.keys(filtersData).map((key) => ({
        [key]: {
          equals: (filtersData as any)[key],
        },
      })),
    });
  }

  const whereConditions =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const result = await prisma.user.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      profile: true,
      userInterests: true,
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

const getMyProfile = async (payload: IJWTPayload) => {
  const profile = await prisma.user.findUniqueOrThrow({
    where: { email: payload.email },
    select: {
      email: true,
      role: true,
      profile: true,
    },
  });
  return profile;
};

const getUser = async (req: Request) => {
  const userId = req.params.id as string;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true },
  });
  return user;
};

/* Dashboard State */

const getUserSummary = async (userId: string) => {
  const joined = await prisma.eventParticipant.count({
    where: { userId },
  });

  const upcoming = await prisma.eventParticipant.count({
    where: {
      userId,
      event: {
        date: { gte: new Date() },
      },
    },
  });

  const completed = await prisma.eventParticipant.count({
    where: {
      userId,
      event: {
        date: { lt: new Date() },
      },
    },
  });

  return {
    joined,
    upcoming,
    completed,
  };
};

const getUserUpcomingEvents = async (userId: string) => {
  return prisma.eventParticipant.findMany({
    where: {
      userId,
      event: {
        date: { gte: new Date() },
      },
    },
    include: {
      event: true,
    },
    orderBy: {
      event: { date: "asc" },
    },
    take: 5,
  });
};

const getUserRecentParticipants = async (userId: string) => {
  return prisma.eventParticipant.findMany({
    where: {
      userId,
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

const updateProfile = async (authUser: IJWTPayload, req: Request) => {
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.profile.image = uploadResult?.secure_url as string;
  }

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: { profile: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updateUserData: any = {};
  const updateProfileData: any = {};

  // 🔐 Password update (optional)
  if (req.body.password) {
    updateUserData.password = await bcrypt.hash(req.body.password, 10);
  }

  if (req.body.role) {
    updateUserData.role = req.body.role;
  }

  // 🧾 Profile update
  if (req.body.profile) {
    Object.assign(updateProfileData, req.body.profile);
  }

  // 🔁 Transaction (important!)
  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateProfileData).length && user.profile?.id) {
      await tx.profile.update({
        where: { id: user.profile.id },
        data: updateProfileData,
      });
    }

    return tx.user.update({
      where: { id: user.id },
      data: updateUserData,
      include: { profile: true },
    });
  });

  return result;
};
const updateUser = async (authUser: IJWTPayload, req: Request) => {
  const { id } = req.params as { id: string };
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.profile.image = uploadResult?.secure_url as string;
  }

  const user = await prisma.user.findUnique({
    where: { id: id },
    include: { profile: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updateUserData: any = {};
  const updateProfileData: any = {};

  // 🔐 Password update (optional)
  if (req.body.password) {
    updateUserData.password = await bcrypt.hash(req.body.password, 10);
  }

  if (req.body.role) {
    updateUserData.role = req.body.role;
  }

  // 🧾 Profile update
  if (req.body.profile) {
    Object.assign(updateProfileData, req.body.profile);
  }

  // 🔁 Transaction (important!)
  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateProfileData).length && user.profile?.id) {
      await tx.profile.update({
        where: { id: user.profile.id },
        data: updateProfileData,
      });
    }

    return tx.user.update({
      where: { id: user.id },
      data: updateUserData,
      include: { profile: true },
    });
  });

  return result;
};

const deleteUser = async (req: Request) => {
  const result = await prisma.user.delete({
    where: { id: req.params.id as string },
  });
  return result;
};

export const UserService = {
  createUser,
  getAllUser,
  deleteUser,
  getMyProfile,
  updateProfile,
  createInterest,
  getAllInterests,
  getUser,
  updateUser,
  getUserSummary,
  getUserUpcomingEvents,
  getUserRecentParticipants,
};
