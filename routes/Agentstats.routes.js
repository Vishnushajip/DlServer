import express from "express";
import {
  getAgentStats,
  getTopAgentsThisMonth,
  getAgentWeeklyDocuments,
} from "../controllers/Agentstats.controller.js";

const router = express.Router();

router.get("/stats", getAgentStats);
router.get("/top-agents", getTopAgentsThisMonth);
router.get("/agent/documents", getAgentWeeklyDocuments);
export default router;
