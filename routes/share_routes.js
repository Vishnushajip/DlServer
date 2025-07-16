import express from "express";
import { getPropertyById } from "../controllers/share_controller.js";

const router = express.Router();

router.get("/:id", getPropertyById);

export default router;
