import { Request, Response } from 'express';
import { movieEnrichmentService } from '../services/movieEnrichmentService';
import { ApiResponse, Movie, AuthRequest } from '../types';

export const enrichMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    
    if (!movieId) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie ID is required',
      };
      res.status(400).json(response);
      return;
    }

    const enrichedMovie = await movieEnrichmentService.enrichMovieWithTMDBData({ id: movieId } as Movie);

    const response: ApiResponse<Movie> = {
      success: true,
      data: enrichedMovie,
      message: 'Movie enriched successfully',
    };
    res.json(response);
  } catch (error) {
    console.error('Movie enrichment error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to enrich movie',
    };
    res.status(500).json(response);
  }
};

export const enrichAllMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await movieEnrichmentService.enrichAllMoviesInDatabase();

    const response: ApiResponse = {
      success: true,
      data: result,
      message: `Enrichment complete: ${result.enriched} enriched, ${result.failed} failed out of ${result.total} total movies`,
    };
    res.json(response);
  } catch (error) {
    console.error('Bulk enrichment error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to enrich movies',
    };
    res.status(500).json(response);
  }
};

export const getMovieRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!movieId) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie ID is required',
      };
      res.status(400).json(response);
      return;
    }

    const recommendations = await movieEnrichmentService.getMovieRecommendations(movieId, limit);

    const response: ApiResponse<Movie[]> = {
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} recommendations`,
    };
    res.json(response);
  } catch (error) {
    console.error('Movie recommendations error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get movie recommendations',
    };
    res.status(500).json(response);
  }
};

export const getSimilarMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!movieId) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie ID is required',
      };
      res.status(400).json(response);
      return;
    }

    const similarMovies = await movieEnrichmentService.getSimilarMovies(movieId, limit);

    const response: ApiResponse<Movie[]> = {
      success: true,
      data: similarMovies,
      message: `Found ${similarMovies.length} similar movies`,
    };
    res.json(response);
  } catch (error) {
    console.error('Similar movies error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get similar movies',
    };
    res.status(500).json(response);
  }
};

export const updateMovieMetadata = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie ID is required',
      };
      res.status(400).json(response);
      return;
    }

    const updatedMovie = await movieEnrichmentService.updateMovieMetadata(movieId);

    if (!updatedMovie) {
      const response: ApiResponse = {
        success: false,
        error: 'Movie not found or TMDB ID missing',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Movie> = {
      success: true,
      data: updatedMovie,
      message: 'Movie metadata updated successfully',
    };
    res.json(response);
  } catch (error) {
    console.error('Movie metadata update error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update movie metadata',
    };
    res.status(500).json(response);
  }
};

export const getMissingMovieData = async (req: Request, res: Response): Promise<void> => {
  try {
    const missingData = await movieEnrichmentService.findMissingMovieData();

    const response: ApiResponse = {
      success: true,
      data: {
        moviesWithoutImages: missingData.moviesWithoutImages.length,
        moviesWithoutTMDBId: missingData.moviesWithoutTMDBId.length,
        moviesWithoutDirector: missingData.moviesWithoutDirector.length,
        moviesWithoutActors: missingData.moviesWithoutActors.length,
        details: missingData,
      },
      message: 'Missing movie data analysis complete',
    };
    res.json(response);
  } catch (error) {
    console.error('Missing data analysis error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to analyze missing movie data',
    };
    res.status(500).json(response);
  }
};