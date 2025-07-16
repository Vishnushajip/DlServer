import express from "express";
import { getPropertiesByIds } from "../controllers/property.controller.js";

const router = express.Router();

router.post("/getPropertiesByIds", getPropertiesByIds);

export default router;
