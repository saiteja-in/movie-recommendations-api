import { Router } from 'express';
import {
  enrichMovie,
  enrichAllMovies,
  getMovieRecommendations,
  getSimilarMovies,
  updateMovieMetadata,
  getMissingMovieData,
} from '../controllers/enrichmentController';
import { authenticateToken } from '../middleware/auth';
import { validateParams } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const MovieIdSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
});

// Public endpoints
router.get('/movies/:movieId/recommendations', 
  validateParams(MovieIdSchema), 
  getMovieRecommendations
);

router.get('/movies/:movieId/similar', 
  validateParams(MovieIdSchema), 
  getSimilarMovies
);

router.get('/analysis/missing-data', getMissingMovieData);

// Protected endpoints (authentication required)
router.post('/movies/:movieId/enrich', 
  authenticateToken, 
  validateParams(MovieIdSchema), 
  enrichMovie
);

router.post('/movies/enrich-all', 
  authenticateToken, 
  enrichAllMovies
);

router.put('/movies/:movieId/metadata', 
  authenticateToken, 
  validateParams(MovieIdSchema), 
  updateMovieMetadata
);

export default router;