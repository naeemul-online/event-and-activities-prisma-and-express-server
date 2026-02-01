import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../helper/fileUploader";
import auth from "../../middlewares/auth";

import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/register",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidation.createUserValidationSchema.parse(
      JSON.parse(req.body.data),
    );

    return UserController.createUser(req, res, next);
  },
);

router.post(
  "/create-interest",
  auth(UserRole.ADMIN),
  UserController.createInterest,
);

// data with access token in cookie -> check the role -> give access to the protected route

// dashboard state

router.get("/summary", auth(UserRole.USER), UserController.getUserSummary);
router.get(
  "/upcoming-events",
  auth(UserRole.USER),
  UserController.getUserUpcomingEvents,
);

router.get(
  "/recent-participants",
  auth(UserRole.USER),
  UserController.getUserRecentParticipants,
);

router.get("/", auth(UserRole.ADMIN), UserController.getAllUser);

router.get("/all-interests", UserController.getAllInterests);

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  UserController.getMyProfile,
);

router.get("/:id", auth(UserRole.ADMIN), UserController.getUser);

router.patch(
  "/me/update-my-profile",
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidation.updateUserValidationSchema.parse(
      JSON.parse(req.body.data),
    );
    return UserController.updateProfile(req, res, next);
  },
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidation.updateUserValidationSchema.parse(
      JSON.parse(req.body.data),
    );
    return UserController.updateUser(req, res, next);
  },
);

router.delete("/:id", auth(UserRole.ADMIN), UserController.deleteUser);

export const userRoutes = router;
