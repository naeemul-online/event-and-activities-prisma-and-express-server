import bcrypt from "bcryptjs";
import httpStatus from "http-status";

import config from "../../../config";
import ApiError from "../../errors/ApiError";
import { jwtHelper } from "../../helper/jwtHelper";
import { prisma } from "../../shared/prisma";

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { profile: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid password");
  }

  const accessToken = await jwtHelper.generateToken(
    {
      id: user.id,
      name: user.profile?.fullName,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_token_secret!,
    "1d"
  );

  const refreshToken = await jwtHelper.generateToken(
    { email: user.email, role: user.role },
    config.jwt_refresh_token_secret!,
    "90d"
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (session: any) => {
  const accessToken = session.accessToken;
  const decodedData = jwtHelper.verifyToken(
    accessToken,
    config.jwt_access_token_secret as string
  );

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
    },
    include: { profile: true },
  });

  console.log(userData);

  const { id, email, role, profile } = userData;

  return {
    id,
    email,
    role,
    profile,
  };
};

export const AuthService = {
  login,
  getMe,
};
