import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "./../../types/common";
import { EventService } from "./event.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await EventService.createCategory(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

const createEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const event = await EventService.createEvent(req.user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Event created successfully",
      data: event,
    });
  }
);

const getAllEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await EventService.getAllEvent(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All Event Retrieved Successfully",
    data: event,
  });
});

export const EventController = {
  createCategory,
  createEvent,
  getAllEvent,
};
