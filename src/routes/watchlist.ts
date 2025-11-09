import { Router } from 'express';
import { addToWatchlist, removeFromWatchlist, getUserWatchlist } from '../controllers/watchlistController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { WatchlistItemSchema } from '../schemas/validation';
import { z } from 'zod';

const router = Router();

const MovieIdSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
});

router.get('/', authenticateToken, getUserWatchlist);

router.post('/:movieId', 
  authenticateToken, 
  validateParams(MovieIdSchema), 
  validateBody(WatchlistItemSchema.omit({ movieId: true })), 
  addToWatchlist
);

router.delete('/:movieId', 
  authenticateToken, 
  validateParams(MovieIdSchema), 
  removeFromWatchlist
);

export = router;