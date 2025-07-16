import express from "express";
import {
  getPropertyAnalytics,
} from "../controllers/propertyAnalytics.controller.js";

const router = express.Router();

router.get("/", getPropertyAnalytics);

export default router;
