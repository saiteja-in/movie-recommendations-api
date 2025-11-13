import { Router } from 'express';
import {
  searchTMDBMovies,
  getPopularTMDBMovies,
  getTopRatedTMDBMovies,
  getTrendingTMDBMovies,
  importMovieFromTMDB,
  importPopularMovies,
  getTMDBGenres,
  getMoviesByTMDBGenre,
} from '../controllers/tmdbController';
import { authenticateToken } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const TMDBSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().min(1).optional(),
});

const TMDBPageSchema = z.object({
  page: z.number().int().min(1).optional(),
});

const TMDBTrendingSchema = z.object({
  timeWindow: z.enum(['day', 'week']).optional(),
});

const TMDBIdSchema = z.object({
  tmdbId: z.string().regex(/^\d+$/, 'TMDB ID must be a number'),
});

const TMDBGenreIdSchema = z.object({
  genreId: z.string().regex(/^\d+$/, 'Genre ID must be a number'),
});

const ImportLimitSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

// Public endpoints (no authentication required)
router.get('/search', validateQuery(TMDBSearchSchema), searchTMDBMovies);
router.get('/popular', validateQuery(TMDBPageSchema), getPopularTMDBMovies);
router.get('/top-rated', validateQuery(TMDBPageSchema), getTopRatedTMDBMovies);
router.get('/trending', validateQuery(TMDBTrendingSchema), getTrendingTMDBMovies);
router.get('/genres', getTMDBGenres);
router.get('/genre/:genreId', 
  validateParams(TMDBGenreIdSchema), 
  validateQuery(TMDBPageSchema), 
  getMoviesByTMDBGenre
);

// Protected endpoints (authentication required)
router.post('/import/:tmdbId', 
  authenticateToken, 
  validateParams(TMDBIdSchema), 
  importMovieFromTMDB
);

router.post('/import/popular', 
  authenticateToken, 
  validateQuery(ImportLimitSchema), 
  importPopularMovies
);

export default router;