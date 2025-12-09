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
      JSON.parse(req.body.data)
    );

    return UserController.createUser(req, res, next);
  }
);

// data with access token in cookie -> check the role -> give access to the protected route

router.get("/", auth(UserRole.ADMIN), UserController.getAllUser);

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  UserController.getMyProfile
);

router.patch(
  "/me/update-profile",
  auth(UserRole.ADMIN, UserRole.HOST, UserRole.USER),
  UserController.updateProfile
);

router.delete("/:id", auth(UserRole.ADMIN), UserController.deleteUser);

export const userRoutes = router;
