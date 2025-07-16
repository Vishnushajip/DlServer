import express from 'express';
import { getPropertyAgentAnalytics } from '../controllers/agentStatsController.js';

const router = express.Router();

/**
 * @route GET /api/agents/subtype-stats
 * @description Get statistics of property subtypes uploaded by agents
 * @queryParam {string} timeRange - day/week/month
 * @queryParam {string} [startDate] - Optional start date (YYYY-MM-DD)
 * @queryParam {string} [endDate] - Optional end date (YYYY-MM-DD)
 * @returns {Object} Subtype statistics with time period information
 */
router.get('/api/agentstats', getPropertyAgentAnalytics);

export default router;