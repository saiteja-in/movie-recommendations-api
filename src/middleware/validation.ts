import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../types';

export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        const response: ApiResponse = {
          success: false,
          error: `Validation failed: ${errors.join(', ')}`,
        };
        res.status(400).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
      };
      res.status(400).json(response);
    }
  };
};

export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Convert query string values to appropriate types
      const processedQuery: any = {};
      
      for (const [key, value] of Object.entries(req.query)) {
        if (value === undefined) continue;
        
        // Try to parse numbers
        if (typeof value === 'string' && !isNaN(Number(value))) {
          processedQuery[key] = Number(value);
        } else if (value === 'true') {
          processedQuery[key] = true;
        } else if (value === 'false') {
          processedQuery[key] = false;
        } else {
          processedQuery[key] = value;
        }
      }
      
      const result = schema.parse(processedQuery);
      req.query = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        const response: ApiResponse = {
          success: false,
          error: `Query validation failed: ${errors.join(', ')}`,
        };
        res.status(400).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Query validation failed',
      };
      res.status(400).json(response);
    }
  };
};

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.params = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        const response: ApiResponse = {
          success: false,
          error: `Parameter validation failed: ${errors.join(', ')}`,
        };
        res.status(400).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Parameter validation failed',
      };
      res.status(400).json(response);
    }
  };
};