import { Response } from 'express';
import { db } from '../services/database';
import { AIService } from '../services/aiService';
import { RecommendationEngine } from '../services/recommendationEngine';
import { ApiResponse, Recommendation, AuthRequest } from '../types';

export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { algorithm = 'hybrid', limit = 10 } = req.query;
    const { movies: allMovies } = await db.getMovies();
    
    let recommendations: Recommendation[] = [];

    switch (algorithm) {
      case 'collaborative':
        recommendations = await RecommendationEngine.generateCollaborativeRecommendations(
          user.id, allMovies, Number(limit)
        );
        break;
      case 'content':
        recommendations = await RecommendationEngine.generateContentBasedRecommendations(
          user.id, allMovies, Number(limit)
        );
        break;
      case 'ai':
        // Use AI service for OpenAI recommendations
        const userRatings = await db.getUserRatings(user.id);
        const likedMovies = [];
        for (const rating of userRatings.filter(r => r.liked)) {
          const movie = await db.getMovieById(rating.movieId);
          if (movie) likedMovies.push(movie);
        }
        recommendations = await AIService.generateRecommendations(
          userRatings, allMovies, likedMovies
        );
        break;
      case 'hybrid':
      default:
        recommendations = await RecommendationEngine.generateHybridRecommendations(
          user.id, allMovies, Number(limit)
        );
        break;
    }

    const response: ApiResponse<Recommendation[]> = {
      success: true,
      data: recommendations,
      message: `Generated ${recommendations.length} ${algorithm} recommendations`,
    };
    res.json(response);
  } catch (error) {
    console.error('Recommendation error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to generate recommendations',
    };
    res.status(500).json(response);
  }
};

export const getGenreRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genre } = req.params;
    const { movies: allMovies } = await db.getMovies();
    
    const genreMovies = allMovies.filter(movie => 
      movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    );

    if (genreMovies.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: `No movies found for genre: ${genre}`,
      };
      res.status(404).json(response);
      return;
    }

    const recommendations: Recommendation[] = genreMovies
      .sort((a, b) => b.year - a.year)
      .slice(0, 10)
      .map((movie, index) => ({
        movie,
        score: 0.9 - (index * 0.05),
        reason: `Popular ${genre} movie`,
      }));

    const response: ApiResponse<Recommendation[]> = {
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} ${genre} recommendations`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get genre recommendations',
    };
    res.status(500).json(response);
  }
};