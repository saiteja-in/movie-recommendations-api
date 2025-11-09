import { Response } from 'express';
import { db } from '../services/database';
import { ApiResponse, WatchlistItem, AuthRequest, Movie } from '../types';

export const addToWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { priority = 'medium', notes } = req.body;

    const movie = await db.getMovieById(movieId);
    if (!movie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found',
      };
      res.status(404).json(response);
      return;
    }

    const watchlistData = {
      userId: user.id,
      movieId,
      priority,
      notes,
    };

    const watchlistItem = await db.addToWatchlist(watchlistData);

    const response: ApiResponse<WatchlistItem> = {
      success: true,
      data: watchlistItem,
      message: 'Movie added to watchlist',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to add movie to watchlist',
    };
    res.status(500).json(response);
  }
};

export const removeFromWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
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
    await db.removeFromWatchlist(user.id, movieId);

    const response: ApiResponse = {
      success: true,
      message: 'Movie removed from watchlist',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to remove movie from watchlist',
    };
    res.status(500).json(response);
  }
};

export const getUserWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const watchlistItems = await db.getUserWatchlist(user.id);
    
    // Populate with movie details
    const watchlistWithMovies = await Promise.all(
      watchlistItems.map(async (item) => {
        const movie = await db.getMovieById(item.movieId);
        return {
          ...item,
          movie,
        };
      })
    );

    const response: ApiResponse<(WatchlistItem & { movie: Movie | null })[]> = {
      success: true,
      data: watchlistWithMovies,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch watchlist',
    };
    res.status(500).json(response);
  }
};