import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../helper/fileUploader";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.get("/", UserController.getAllUser);

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

router.delete("/:id", UserController.deleteUser);

export const userRoutes = router;
