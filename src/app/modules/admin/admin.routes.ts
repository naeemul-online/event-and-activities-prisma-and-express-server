import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { AdminController } from "./admin.controller";

const router = express.Router();

// data with access token in cookie -> check the role -> give access to the protected route

router.get("/", auth(UserRole.ADMIN), AdminController.getDashboardOverview);
router.get(
  "/recent-users",
  auth(UserRole.ADMIN),
  AdminController.getRecentUsers,
);

router.get(
  "/recent-events",
  auth(UserRole.ADMIN),
  AdminController.getRecentEvents,
);

export const adminRoutes = router;
