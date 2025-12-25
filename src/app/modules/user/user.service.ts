import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import { Request } from "express";
import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import { userSearchableFields } from "./user.constant";
import ApiError from "../../errors/ApiError";

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

const updateProfile = async (payload: IJWTPayload, req: Request) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { profile: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.CONFLICT, "Event is full");
  }

  let updatedData = { ...req.body };

  const result = await prisma.profile.update({
    where: { id: user.profile?.id as string },
    data: updatedData,
  });

  return result;
};

const deleteUser = async (req: Request) => {
  const result = await prisma.profile.delete({
    where: { id: req.params.id },
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
};
