import { Request, Response } from 'express';
import { db } from '../services/database';
import { ApiResponse, Movie, PaginatedResponse, AuthRequest } from '../types';

export const getAllMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { movies, total } = await db.getMovies(page, limit);
    
    const response: ApiResponse<PaginatedResponse<Movie>> = {
      success: true,
      data: {
        data: movies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch movies',
    };
    res.status(500).json(response);
  }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const movie = await db.getMovieById(id);

    if (!movie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Movie> = {
      success: true,
      data: movie,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch movie',
    };
    res.status(500).json(response);
  }
};

export const createMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movieData = req.body;
    const movie = await db.createMovie(movieData);

    const response: ApiResponse<Movie> = {
      success: true,
      data: movie,
      message: 'Movie created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create movie',
    };
    res.status(500).json(response);
  }
};

export const updateMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingMovie = await db.getMovieById(id);
    if (!existingMovie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found',
      };
      res.status(404).json(response);
      return;
    }

    const updatedMovie = await db.updateMovie(id, updateData);

    const response: ApiResponse<Movie> = {
      success: true,
      data: updatedMovie,
      message: 'Movie updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update movie',
    };
    res.status(500).json(response);
  }
};

export const deleteMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingMovie = await db.getMovieById(id);
    if (!existingMovie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found',
      };
      res.status(404).json(response);
      return;
    }

    await db.deleteMovie(id);

    const response: ApiResponse = {
      success: true,
      message: 'Movie deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete movie',
    };
    res.status(500).json(response);
  }
};

export const searchMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchParams = {
      query: req.query.query as string,
      genre: req.query.genre as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      director: req.query.director as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating as string) : undefined,
      language: req.query.language as string,
      country: req.query.country as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const { movies, total } = await db.searchMovies(searchParams);

    const response: ApiResponse<PaginatedResponse<Movie>> = {
      success: true,
      data: {
        data: movies,
        pagination: {
          page: searchParams.page || 1,
          limit: searchParams.limit || 20,
          total,
          pages: Math.ceil(total / (searchParams.limit || 20)),
        },
      },
      message: total > 0 
        ? `Found ${total} movies in database`
        : 'No movies found in database. Try using /api/tmdb/search to search external movies.',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to search movies',
    };
    res.status(500).json(response);
  }
};