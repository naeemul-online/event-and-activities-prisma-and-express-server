import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { HostController } from "./host.controller";

const router = express.Router();

router.get("/", HostController.getAllHost);
router.get("/top-rated", HostController.getTopRatedHosts);
router.get("/summary", auth(UserRole.HOST), HostController.getHostSummary);
router.get(
  "/upcoming-events",
  auth(UserRole.HOST),
  HostController.getHostUpcomingEvents,
);
router.get(
  "/recent-participants",
  auth(UserRole.HOST),
  HostController.getHostRecentParticipants,
);

export const hostRoutes = router;
