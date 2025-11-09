import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for recommendation endpoints (more lenient)
export const recommendationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    success: false,
    error: 'Too many recommendation requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for movie creation (strict)
export const createMovieLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 movie creations per hour
  message: {
    success: false,
    error: 'Too many movie creation requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});