import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a Registry to register metrics
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// HTTP Request Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
  registers: [register],
});

export const dbConnectionActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Business Logic Metrics
export const moviesTotal = new Gauge({
  name: 'movies_total',
  help: 'Total number of movies in database',
  registers: [register],
});

export const usersTotal = new Gauge({
  name: 'users_total',
  help: 'Total number of users in database',
  registers: [register],
});

export const ratingsTotal = new Gauge({
  name: 'ratings_total',
  help: 'Total number of ratings in database',
  registers: [register],
});

export const watchlistItemsTotal = new Gauge({
  name: 'watchlist_items_total',
  help: 'Total number of watchlist items',
  registers: [register],
});

// Recommendation Metrics
export const recommendationsGenerated = new Counter({
  name: 'recommendations_generated_total',
  help: 'Total number of recommendations generated',
  labelNames: ['algorithm', 'status'],
  registers: [register],
});

export const recommendationDuration = new Histogram({
  name: 'recommendation_duration_seconds',
  help: 'Duration of recommendation generation in seconds',
  labelNames: ['algorithm'],
  buckets: [0.5, 1, 2, 3, 5, 10],
  registers: [register],
});

// External API Metrics
export const tmdbApiRequests = new Counter({
  name: 'tmdb_api_requests_total',
  help: 'Total number of TMDB API requests',
  labelNames: ['endpoint', 'status'],
  registers: [register],
});

export const tmdbApiDuration = new Histogram({
  name: 'tmdb_api_duration_seconds',
  help: 'Duration of TMDB API requests in seconds',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const openaiApiRequests = new Counter({
  name: 'openai_api_requests_total',
  help: 'Total number of OpenAI API requests',
  labelNames: ['model', 'status'],
  registers: [register],
});

export const openaiApiDuration = new Histogram({
  name: 'openai_api_duration_seconds',
  help: 'Duration of OpenAI API requests in seconds',
  labelNames: ['model'],
  buckets: [1, 2, 3, 5, 10],
  registers: [register],
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheSize = new Gauge({
  name: 'cache_size',
  help: 'Current cache size',
  labelNames: ['cache_type'],
  registers: [register],
});

// Authentication Metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'],
  registers: [register],
});

// Rate Limiting Metrics
export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint'],
  registers: [register],
});

// Application Health Metrics
export const applicationUptime = new Gauge({
  name: 'application_uptime_seconds',
  help: 'Application uptime in seconds',
  registers: [register],
});

export const applicationVersion = new Gauge({
  name: 'application_version_info',
  help: 'Application version information',
  labelNames: ['version'],
  registers: [register],
});

// Initialize application version
applicationVersion.set({ version: process.env.npm_package_version || '1.0.0' }, 1);

// Track uptime
const startTime = Date.now();
setInterval(() => {
  applicationUptime.set((Date.now() - startTime) / 1000);
}, 1000);

