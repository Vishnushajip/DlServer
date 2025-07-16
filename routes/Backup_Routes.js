import express from 'express';
import propertyController from '../controllers/backup.controller.js';

const router = express.Router();

router.post('/', propertyController.saveProperty);
router.get('/', propertyController.getProperties);

export default router;