import { Request, Response } from "express";
import pick from "../../helper/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "./../../types/common";
import { eventFilterableFields } from "./event.constant";
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
    const event = await EventService.createEvent(req.user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Event created successfully",
      data: event,
    });
  }
);

const joinEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const event = await EventService.joinEvent(req.user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Event join successfully",
      data: event,
    });
  }
);

const getAllEvent = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, eventFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const event = await EventService.getAllEvent(filters, options);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All Event Retrieved Successfully",
    data: event,
  });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await EventService.getSingleEvent(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Event Retrieved Successfully",
    data: event,
  });
});

const getAllCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await EventService.getAllCategory(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "All Event Category Retrieved Successfully",
    data: category,
  });
});

export const EventController = {
  createCategory,
  createEvent,
  joinEvent,
  getAllEvent,
  getSingleEvent,
  getAllCategory,
};
