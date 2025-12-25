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

const reviewEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const review = await EventService.reviewEvent(req.user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Review successfully submitted",
      data: review,
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
    meta: event.meta,
    data: event.data,
  });
});

const getMyEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    console.log(user);
    const filters = pick(req.query, eventFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const event = await EventService.getMyEvents(user!.id, filters, options);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "My Events Retrieved Successfully",
      meta: event.meta,
      data: event.data,
    });
  }
);

const getJoinedEvents = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    console.log(user);
    const filters = pick(req.query, eventFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const event = await EventService.getJoinEvents(user!.id, filters, options);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Joined events retrieved successfully",
      meta: event.meta,
      data: event.data,
    });
  }
);

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

const updateEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const event = await EventService.updateEvent(req.user as IJWTPayload, req);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  }
);

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.deleteEvent(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Event deleted Successfully",
    data: null,
  });
});

export const EventController = {
  createCategory,
  createEvent,
  joinEvent,
  getAllEvent,
  getSingleEvent,
  getAllCategory,
  reviewEvent,
  deleteEvent,
  updateEvent,
  getMyEvent,
  getJoinedEvents,
};
