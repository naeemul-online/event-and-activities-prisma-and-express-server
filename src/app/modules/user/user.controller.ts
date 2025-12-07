import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types/common";
import { UserService } from "./user.service";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully!",
    data: result,
  });
});

const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUser(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All user retrieved successfully!",
    data: result,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.getMyProfile(user as IJWTPayload);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Your profile retrieved successfully!",
      data: result,
    });
  }
);

const updateProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.updateProfile(user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Your profile updated successfully!",
      data: result,
    });
  }
);

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.deleteUser(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUser,
  getMyProfile,
  updateProfile,
  deleteUser,
};
