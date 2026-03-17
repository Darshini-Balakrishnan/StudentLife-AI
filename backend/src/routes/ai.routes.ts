import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as aiController from '../controllers/ai.controller';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/chat', authenticate, strictRateLimiter, aiController.chat);
router.get('/history', authenticate, aiController.getChatHistory);

export default router;
