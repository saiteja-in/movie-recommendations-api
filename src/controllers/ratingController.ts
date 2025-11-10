import { Response } from 'express';
import { db } from '../services/database';
import { ApiResponse, Rating, AuthRequest } from '../types';

export const rateMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const { movieId } = req.params;
    const { rating, liked } = req.body;

    const movie = await db.getMovieById(movieId);
    if (!movie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found',
      };
      res.status(404).json(response);
      return;
    }

    const ratingData = {
      userId: user.id,
      movieId,
      rating: rating || 0,
      liked: liked !== undefined ? liked : rating > 3,
      review: req.body.review,
    };

    const newRating = await db.createOrUpdateRating(ratingData);

    const response: ApiResponse<Rating> = {
      success: true,
      data: newRating,
      message: 'Movie rated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to rate movie',
    };
    res.status(500).json(response);
  }
};

export const getUserRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const ratings = await db.getUserRatings(user.id);
    const response: ApiResponse<Rating[]> = {
      success: true,
      data: ratings,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user ratings',
    };
    res.status(500).json(response);
  }
};

export const getMovieRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Support both path parameter and query parameter
    const movieId = req.params.movieId || (req.query.movieId as string);
    
    if (!movieId) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie ID is required',
      };
      res.status(400).json(response);
      return;
    }
    
    const movie = await db.getMovieById(movieId);
    if (!movie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found',
      };
      res.status(404).json(response);
      return;
    }

    const ratings = await db.getMovieRatings(movieId);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    const response: ApiResponse<{ ratings: Rating[]; averageRating: number; totalRatings: number }> = {
      success: true,
      data: {
        ratings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch movie ratings',
    };
    res.status(500).json(response);
  }
};