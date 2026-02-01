import { Request, Response } from "express";
import pick from "../../helper/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardOverview();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard overview retrieved successfully!",
    data: result,
  });
});

const getRecentUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["limit"]);

  const result = await AdminService.getRecentUsers(options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recent users retrieved successfully!",
    data: result,
  });
});

const getRecentEvents = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["limit"]);

  const result = await AdminService.getRecentEvents(options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recent events retrieved successfully!",
    data: result,
  });
});

export const AdminController = {
  getDashboardOverview,
  getRecentUsers,
  getRecentEvents,
};
