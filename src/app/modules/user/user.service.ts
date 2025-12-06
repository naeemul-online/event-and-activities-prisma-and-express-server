import bcrypt from "bcryptjs";
import { Request } from "express";
import { fileUploader } from "../../helper/fileUploader";
import { prisma } from "../../shared/prisma";

const createUser = async (req: Request) => {
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.profile.image = uploadResult?.secure_url as string;
  }

  const hashPassword = await bcrypt.hash(req.body.password, 10);

  const result = await prisma.$transaction(async (tnx: any) => {
    const newUser = await tnx.user.create({
      data: {
        email: req.body.email,
        password: hashPassword,
        role: req.body.role,
        averageRating: req.body.averageRating,
      },
    });
    return await tnx.profile.create({
      data: { ...req.body.profile, userId: newUser.id },
    });
  });

  return result;
};

const getAllUser = async (req: Request) => {
  const users = await prisma.user.findMany({
    include: { profile: true },
  });
  return users;
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
};
