import { Router } from 'express';
import { rateMovie, getUserRatings, getMovieRatings } from '../controllers/ratingController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { RatingSchema } from '../schemas/validation';
import { z } from 'zod';

const router = Router();

const MovieIdSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
});

router.post('/movie/:movieId', 
  authenticateToken, 
  validateParams(MovieIdSchema), 
  validateBody(RatingSchema), 
  rateMovie
);

router.get('/user', authenticateToken, getUserRatings);

router.get('/movie/:movieId', validateParams(MovieIdSchema), getMovieRatings);

export = router;