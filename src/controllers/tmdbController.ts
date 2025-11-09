import { Request, Response } from 'express';
import { tmdbService } from '../services/tmdbService';
import { db } from '../services/database';
import { ApiResponse, Movie, PaginatedResponse, AuthRequest } from '../types';

export const searchTMDBMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured. Please add TMDB_API_KEY to environment variables.',
      };
      res.status(503).json(response);
      return;
    }

    const { query, page = 1 } = req.query;
    
    if (!query || typeof query !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: 'Search query is required',
      };
      res.status(400).json(response);
      return;
    }

    const { movies, totalPages, totalResults } = await tmdbService.searchMovies(
      query, 
      parseInt(page as string) || 1
    );

    const response: ApiResponse<PaginatedResponse<Movie>> = {
      success: true,
      data: {
        data: movies,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: 20, // TMDB default
          total: totalResults,
          pages: totalPages,
        },
      },
      message: `Found ${totalResults} movies`,
    };
    res.json(response);
  } catch (error) {
    console.error('TMDB search error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to search movies from TMDB',
    };
    res.status(500).json(response);
  }
};

export const getPopularTMDBMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const { page = 1 } = req.query;
    const { movies, totalPages, totalResults } = await tmdbService.getPopularMovies(
      parseInt(page as string) || 1
    );

    const response: ApiResponse<PaginatedResponse<Movie>> = {
      success: true,
      data: {
        data: movies,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: 20,
          total: totalResults,
          pages: totalPages,
        },
      },
    };
    res.json(response);
  } catch (error) {
    console.error('TMDB popular movies error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get popular movies from TMDB',
    };
    res.status(500).json(response);
  }
};

export const getTopRatedTMDBMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const { page = 1 } = req.query;
    const { movies, totalPages, totalResults } = await tmdbService.getTopRatedMovies(
      parseInt(page as string) || 1
    );

    const response: ApiResponse<PaginatedResponse<Movie>> = {
      success: true,
      data: {
        data: movies,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: 20,
          total: totalResults,
          pages: totalPages,
        },
      },
    };
    res.json(response);
  } catch (error) {
    console.error('TMDB top rated movies error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get top rated movies from TMDB',
    };
    res.status(500).json(response);
  }
};

export const getTrendingTMDBMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const { timeWindow = 'week' } = req.query;
    const movies = await tmdbService.getTrendingMovies(
      timeWindow as 'day' | 'week'
    );

    const response: ApiResponse<Movie[]> = {
      success: true,
      data: movies,
    };
    res.json(response);
  } catch (error) {
    console.error('TMDB trending movies error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get trending movies from TMDB',
    };
    res.status(500).json(response);
  }
};

export const importMovieFromTMDB = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const { tmdbId } = req.params;
    
    if (!tmdbId) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB ID is required',
      };
      res.status(400).json(response);
      return;
    }

    // Check if movie already exists in our database
    const existingMovie = await db.searchMovies({ 
      limit: 1,
      page: 1,
    });
    
    const movieExists = existingMovie.movies.some(movie => 
      movie.tmdbId === parseInt(tmdbId)
    );

    if (movieExists) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie already exists in database',
      };
      res.status(409).json(response);
      return;
    }

    // Fetch movie from TMDB
    const tmdbMovie = await tmdbService.getMovieDetails(parseInt(tmdbId));
    
    // Remove the tmdb_ prefix from the ID for our database
    const movieToSave = {
      ...tmdbMovie,
      id: undefined, // Let the database generate the ID
    };

    // Save to our database
    const savedMovie = await db.createMovie(movieToSave);

    const response: ApiResponse<Movie> = {
      success: true,
      data: savedMovie,
      message: 'Movie imported successfully from TMDB',
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Import movie error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to import movie from TMDB',
    };
    res.status(500).json(response);
  }
};

export const importPopularMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const { limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Max 100 movies
    
    // Calculate how many pages we need
    const pages = Math.ceil(limitNum / 20);
    let importedCount = 0;
    let skippedCount = 0;

    for (let page = 1; page <= pages; page++) {
      try {
        const { movies } = await tmdbService.getPopularMovies(page);
        const moviesToImport = movies.slice(0, limitNum - importedCount);

        for (const tmdbMovie of moviesToImport) {
          try {
            // Check if movie already exists
            const existingMovies = await db.searchMovies({
              limit: 1,
              page: 1,
            });
            
            const movieExists = existingMovies.movies.some(movie => 
              movie.tmdbId === tmdbMovie.tmdbId
            );

            if (!movieExists) {
              const movieToSave = {
                ...tmdbMovie,
                id: undefined,
              };
              await db.createMovie(movieToSave);
              importedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.warn(`Failed to import movie ${tmdbMovie.title}:`, error);
            skippedCount++;
          }
        }

        if (importedCount >= limitNum) break;
      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, error);
      }
    }

    const response: ApiResponse = {
      success: true,
      message: `Imported ${importedCount} movies, skipped ${skippedCount} (already exist or failed)`,
      data: { imported: importedCount, skipped: skippedCount },
    };
    res.json(response);
  } catch (error) {
    console.error('Bulk import error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to import popular movies from TMDB',
    };
    res.status(500).json(response);
  }
};

export const getTMDBGenres = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const genres = await tmdbService.getGenres();

    const response: ApiResponse<{ id: number; name: string }[]> = {
      success: true,
      data: genres,
    };
    res.json(response);
  } catch (error) {
    console.error('TMDB genres error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get genres from TMDB',
    };
    res.status(500).json(response);
  }
};

export const getMoviesByTMDBGenre = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!tmdbService.isAvailable()) {
      const response: ApiResponse = {
        success: false,
        error: 'TMDB API is not configured.',
      };
      res.status(503).json(response);
      return;
    }

    const { genreId } = req.params;
    const { page = 1 } = req.query;

    const { movies, totalPages, totalResults } = await tmdbService.getMoviesByGenre(
      parseInt(genreId),
      parseInt(page as string) || 1
    );

    const response: ApiResponse<PaginatedResponse<Movie>> = {
      success: true,
      data: {
        data: movies,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: 20,
          total: totalResults,
          pages: totalPages,
        },
      },
    };
    res.json(response);
  } catch (error) {
    console.error('TMDB movies by genre error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get movies by genre from TMDB',
    };
    res.status(500).json(response);
  }
};