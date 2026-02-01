import { Request, Response } from "express";
import pick from "../../helper/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types/common";
import { userFilterableFields } from "../user/user.constant";
import { HostService } from "./host.service";

const getTopRatedHosts = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 5;

  const data = await HostService.getTopRatedHosts(limit);
  res.status(200).json({
    success: true,
    data,
  });
});

const getAllHost = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await HostService.getAllHost(filters, options);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All user retrieved successfully!",
    data: result,
  });
});

const getHostSummary = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res) => {
    const hostId = req?.user?.id as string;

    const result = await HostService.getHostSummary(hostId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Host dashboard summary fetched successfully",
      data: result,
    });
  },
);
const getHostUpcomingEvents = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res) => {
    const hostId = req?.user?.id as string;

    const result = await HostService.getHostUpcomingEvents(hostId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Host upcoming events fetched successfully",
      data: result,
    });
  },
);
const getHostRecentParticipants = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res) => {
    const hostId = req?.user?.id as string;

    const result = await HostService.getHostRecentParticipants(hostId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Host recent participants fetched successfully",
      data: result,
    });
  },
);

export const HostController = {
  getTopRatedHosts,
  getAllHost,
  getHostSummary,
  getHostUpcomingEvents,
  getHostRecentParticipants,
};
