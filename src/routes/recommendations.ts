import { Router } from 'express';
import { getRecommendations, getGenreRecommendations } from '../controllers/recommendationController';
import { authenticateToken } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { RecommendationRequestSchema } from '../schemas/validation';
import { recommendationLimiter } from '../middleware/rateLimit';
import { z } from 'zod';

const router = Router();

router.get('/', 
  recommendationLimiter,
  authenticateToken, 
  validateQuery(RecommendationRequestSchema.extend({
    algorithm: z.enum(['hybrid', 'collaborative', 'content', 'ai']).optional(),
  })), 
  getRecommendations
);

router.get('/genre/:genre', getGenreRecommendations);
export default router;