import { Router } from 'express';
import { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie, searchMovies } from '../controllers/movieController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { CreateMovieSchema, UpdateMovieSchema, MovieSearchSchema } from '../schemas/validation';
import { createMovieLimiter } from '../middleware/rateLimit';
import { z } from 'zod';

const router = Router();

const MovieIdSchema = z.object({
  id: z.string().min(1, 'Movie ID is required'),
});

router.get('/', validateQuery(z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})), getAllMovies);

router.get('/search', validateQuery(MovieSearchSchema), searchMovies);

router.get('/:id', validateParams(MovieIdSchema), getMovieById);

router.post('/', createMovieLimiter, authenticateToken, validateBody(CreateMovieSchema), createMovie);

router.put('/:id', authenticateToken, validateParams(MovieIdSchema), validateBody(UpdateMovieSchema), updateMovie);

router.delete('/:id', authenticateToken, validateParams(MovieIdSchema), deleteMovie);

export default router;