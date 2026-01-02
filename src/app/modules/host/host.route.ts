import express from "express";
import { HostController } from "./host.controller";

const router = express.Router();

router.get("/top-rated", HostController.getTopRatedHosts);

export const hostRoutes = router;
