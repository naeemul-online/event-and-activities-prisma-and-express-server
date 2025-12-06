import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000 * 24 * 90,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "You are logged in successfully!",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "You are logged out successfully!",
    data: null,
  });
});

export const AuthController = {
  login,
  logout,
};
