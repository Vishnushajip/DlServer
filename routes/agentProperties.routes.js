import express from 'express';
import { getAgentProperties } from '../controllers/agentProperties.controller.js';

const router = express.Router();

router.get('/:agentId/properties', getAgentProperties);


export default router;