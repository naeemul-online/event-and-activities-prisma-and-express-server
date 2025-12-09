import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { EventController } from "./event.controller";
import { eventValidation } from "./event.validation";

const router = express.Router();

router.get(
  "/all-events",
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  EventController.getAllEvent
);

router.post(
  "/categories",
  validateRequest(eventValidation.categorySchema),

  EventController.createCategory
);

router.post(
  "/create-event",
  validateRequest(eventValidation.createEventSchema),
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  EventController.createEvent
);

export const eventRoutes = router;
