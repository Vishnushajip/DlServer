import express from 'express';
import { getLatestPropertyByAgent } from '../controllers/DocumentController.js';

const router = express.Router();

router.get('/latest', getLatestPropertyByAgent);

export default router;