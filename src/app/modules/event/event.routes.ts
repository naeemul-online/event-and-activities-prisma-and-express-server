import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../helper/fileUploader";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { EventController } from "./event.controller";
import { eventValidation } from "./event.validation";

const router = express.Router();

router.get(
  "/all-events",

  EventController.getAllEvent
);

router.get("/my-events", auth(UserRole.HOST), EventController.getMyEvent);

router.get(
  "/joined-events",
  auth(UserRole.USER),
  EventController.getJoinedEvents
);

router.get("/all-events-categories", EventController.getAllCategory);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  EventController.getSingleEvent
);

router.post(
  "/categories",
  validateRequest(eventValidation.categorySchema),

  EventController.createCategory
);

router.post(
  "/review",
  auth(UserRole.USER),
  validateRequest(eventValidation.createReviewSchema),
  EventController.reviewEvent
);

router.post(
  "/create-event",
  auth(UserRole.HOST, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = eventValidation.createEventSchema.parse(
      JSON.parse(req.body.data)
    );

    return EventController.createEvent(req, res, next);
  }
);

router.post("/:eventId/join", auth(UserRole.USER), EventController.joinEvent);

router.patch(
  "/:id",
  auth(UserRole.HOST),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = eventValidation.updateEventSchema.parse(
      JSON.parse(req.body.data)
    );
    return EventController.updateEvent(req, res, next);
  },

  EventController.updateEvent
);

router.delete(
  "/:id",
  auth(UserRole.HOST, UserRole.ADMIN),
  EventController.deleteEvent
);

export const eventRoutes = router;
