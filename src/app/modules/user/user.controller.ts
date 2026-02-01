import { Request, Response } from "express";
import httpStatus from "http-status";
import pick from "../../helper/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types/common";
import { userFilterableFields } from "./user.constant";
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

const createInterest = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createInterest(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Interest created successfully!",
    data: result,
  });
});

/* Dashboard State */
const getUserSummary = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const userId = req.user?.id as string;

    const result = await UserService.getUserSummary(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User dashboard summary fetched successfully",
      data: result,
    });
  },
);

const getUserUpcomingEvents = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const userId = req.user?.id as string;

    const result = await UserService.getUserUpcomingEvents(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Upcoming events fetched successfully",
      data: result,
    });
  },
);

const getUserRecentParticipants = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res) => {
    const userId = req?.user?.id as string;

    const result = await UserService.getUserRecentParticipants(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User recent participants fetched successfully",
      data: result,
    });
  },
);

const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await UserService.getAllUser(filters, options);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All user retrieved successfully!",
    data: result,
  });
});

const getAllInterests = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllInterests(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All interests retrieved successfully!",
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
  },
);

const updateProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.updateProfile(user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  },
);

const updateUser = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.updateUser(user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User updated successfully",
      data: result,
    });
  },
);

const getUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUser(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.deleteUser(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User deleted successfully!",
    data: null,
  });
});

export const UserController = {
  createUser,
  getAllUser,
  getMyProfile,
  updateProfile,
  deleteUser,
  createInterest,
  getAllInterests,
  getUser,
  updateUser,
  getUserSummary,
  getUserUpcomingEvents,
  getUserRecentParticipants,
};
