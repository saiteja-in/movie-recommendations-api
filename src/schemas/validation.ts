import { z } from 'zod';

// Movie schemas
export const MovieSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  genre: z.array(z.string()).min(1, 'At least one genre is required'),
  year: z.number().int().min(1800).max(new Date().getFullYear() + 5),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  director: z.string().optional(),
  actors: z.array(z.string()).optional(),
  rating: z.number().min(0).max(10).optional(),
  imageUrl: z.string().url().optional(),
  runtime: z.number().int().min(1).max(500).optional(), // in minutes
  language: z.string().min(2).max(10).optional(),
  country: z.string().min(2).max(50).optional(),
  imdbId: z.string().optional(),
  tmdbId: z.number().optional(),
});

export const CreateMovieSchema = MovieSchema.omit({ rating: true });
export const UpdateMovieSchema = MovieSchema.partial();

// User schemas
export const UserRegistrationSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  preferences: z.object({
    likedGenres: z.array(z.string()).optional(),
    dislikedGenres: z.array(z.string()).optional(),
    preferredYearRange: z.object({
      min: z.number().int().min(1800),
      max: z.number().int().max(new Date().getFullYear() + 5),
    }).optional(),
  }).optional(),
});

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateUserPreferencesSchema = z.object({
  likedGenres: z.array(z.string()).optional(),
  dislikedGenres: z.array(z.string()).optional(),
  preferredYearRange: z.object({
    min: z.number().int().min(1800),
    max: z.number().int().max(new Date().getFullYear() + 5),
  }).optional(),
});

// Rating schemas
export const RatingSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  liked: z.boolean(),
  review: z.string().max(500).optional(),
});

// Search schemas
export const MovieSearchSchema = z.object({
  query: z.string().optional(),
  genre: z.string().optional(),
  year: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  director: z.string().optional(),
  minRating: z.number().min(0).max(10).optional(),
  maxRating: z.number().min(0).max(10).optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

// Watchlist schemas
export const WatchlistItemSchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  notes: z.string().max(200).optional(),
});

// Recommendation schemas
export const RecommendationRequestSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10).optional(),
  genres: z.array(z.string()).optional(),
  excludeWatched: z.boolean().default(true).optional(),
  minYear: z.number().int().min(1800).optional(),
  maxYear: z.number().int().max(new Date().getFullYear() + 5).optional(),
});

// Validation helpers
export const validateSchema = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return { success: false, errors };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  };
};