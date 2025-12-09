import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors,
} from '../services/metrics';

/**
 * Middleware to collect HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const route = req.route?.path || req.path || 'unknown';

  // Override res.end to capture response status
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode.toString();
    const method = req.method;

    // Record metrics
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );

    httpRequestTotal.inc({ method, route, status_code: statusCode });

    // Record errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      httpRequestErrors.inc({ method, route, status_code: statusCode });
    }
  };

  next();
};

/**
 * Helper function to record database query metrics
 */
export const recordDbQuery = async <T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  const { dbQueryDuration, dbQueryTotal } = await import('../services/metrics');

  try {
    const result = await queryFn();
    const duration = (Date.now() - startTime) / 1000;

    dbQueryDuration.observe({ operation, table }, duration);
    dbQueryTotal.inc({ operation, table });

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    dbQueryDuration.observe({ operation, table }, duration);
    dbQueryTotal.inc({ operation, table });
    throw error;
  }
};

/**
 * Helper function to record external API call metrics
 */
export const recordApiCall = async <T>(
  service: 'tmdb' | 'openai',
  endpoint: string,
  apiCallFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  const {
    tmdbApiRequests,
    tmdbApiDuration,
    openaiApiRequests,
    openaiApiDuration,
  } = await import('../services/metrics');

  try {
    const result = await apiCallFn();
    const duration = (Date.now() - startTime) / 1000;

    if (service === 'tmdb') {
      tmdbApiDuration.observe({ endpoint }, duration);
      tmdbApiRequests.inc({ endpoint, status: 'success' });
    } else {
      openaiApiDuration.observe({ model: endpoint }, duration);
      openaiApiRequests.inc({ model: endpoint, status: 'success' });
    }

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    if (service === 'tmdb') {
      tmdbApiDuration.observe({ endpoint }, duration);
      tmdbApiRequests.inc({ endpoint, status: 'error' });
    } else {
      openaiApiDuration.observe({ model: endpoint }, duration);
      openaiApiRequests.inc({ model: endpoint, status: 'error' });
    }

    throw error;
  }
};

