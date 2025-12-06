import bcrypt from "bcryptjs";

import { jwtHelper } from "../../helper/jwtHelper";
import { prisma } from "../../shared/prisma";

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { profile: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const accessToken = await jwtHelper.generateToken(
    { email: user.email, role: user.role },
    "access-secret-key",
    "1h"
  );

  const refreshToken = await jwtHelper.generateToken(
    { email: user.email, role: user.role },
    "refresh-secret-key",
    "90d"
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  login,
};
