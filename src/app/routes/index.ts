import express from "express";
import { adminRoutes } from "../modules/admin/admin.routes";
import { authRoutes } from "../modules/auth/auth.route";
import { eventRoutes } from "../modules/event/event.routes";
import { hostRoutes } from "../modules/host/host.route";
import { userRoutes } from "../modules/user/user.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/hosts",
    route: hostRoutes,
  },
  {
    path: "/dashboard",
    route: adminRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },

  {
    path: "/event",
    route: eventRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
