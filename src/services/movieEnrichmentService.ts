import { tmdbService } from './tmdbService';
import { db } from './database';
import { Movie } from '../types';

export class MovieEnrichmentService {
  
  async enrichMovieWithTMDBData(movie: Movie): Promise<Movie> {
    try {
      if (movie.tmdbId) {
        return movie;
      }

      const { movies } = await tmdbService.searchMovies(movie.title, 1);
      
      const exactMatch = movies.find(tmdbMovie => 
        tmdbMovie.title.toLowerCase() === movie.title.toLowerCase() &&
        Math.abs(tmdbMovie.year - movie.year) <= 1
      );

      if (exactMatch) {
        const enrichedMovie: Movie = {
          ...movie,
          director: exactMatch.director || movie.director,
          actors: exactMatch.actors && exactMatch.actors.length > 0 ? exactMatch.actors : movie.actors,
          runtime: exactMatch.runtime || movie.runtime,
          language: exactMatch.language || movie.language,
          country: exactMatch.country || movie.country,
          imageUrl: exactMatch.imageUrl || movie.imageUrl,
          tmdbId: exactMatch.tmdbId,
          imdbId: exactMatch.imdbId,
          rating: exactMatch.rating || movie.rating,
          description: exactMatch.description || movie.description,
        };

        await db.updateMovie(movie.id, enrichedMovie);
        return enrichedMovie;
      }
    } catch (error) {
      console.warn(`Failed to enrich movie ${movie.title}:`, error);
    }
    
    return movie;
  }

  async enrichAllMoviesInDatabase(): Promise<{
    enriched: number;
    failed: number;
    total: number;
  }> {
    let enriched = 0;
    let failed = 0;
    let page = 1;
    const limit = 50;
    let totalMovies = 0;

    while (true) {
      try {
        const { movies, total } = await db.getMovies(page, limit);
        totalMovies = total;
        
        if (movies.length === 0) break;

        for (const movie of movies) {
          try {
            if (!movie.tmdbId) {
              const enrichedMovie = await this.enrichMovieWithTMDBData(movie);
              if (enrichedMovie.tmdbId) {
                enriched++;
                await new Promise(resolve => setTimeout(resolve, 250));
              }
            }
          } catch (error) {
            console.warn(`Failed to enrich movie ${movie.title}:`, error);
            failed++;
          }
        }

        page++;
      } catch (error) {
        console.error('Error during bulk enrichment:', error);
        break;
      }
    }

    return { enriched, failed, total: totalMovies };
  }

  async getMovieRecommendations(movieId: string, limit: number = 5): Promise<Movie[]> {
    try {
      const movie = await db.getMovieById(movieId);
      if (!movie || !movie.tmdbId) {
        return [];
      }

      const response = await tmdbService['client'].get(`/movie/${movie.tmdbId}/recommendations`);
      const recommendations = response.data.results.slice(0, limit);

      const convertedMovies = await Promise.all(
        recommendations.map((tmdbMovie: any) => 
          tmdbService['convertTMDBMovieToMovie'](tmdbMovie)
        )
      );

      return convertedMovies;
    } catch (error) {
      console.error('Failed to get movie recommendations:', error);
      return [];
    }
  }

  async getSimilarMovies(movieId: string, limit: number = 5): Promise<Movie[]> {
    try {
      const movie = await db.getMovieById(movieId);
      if (!movie || !movie.tmdbId) {
        return [];
      }

      const response = await tmdbService['client'].get(`/movie/${movie.tmdbId}/similar`);
      const similarMovies = response.data.results.slice(0, limit);

      const convertedMovies = await Promise.all(
        similarMovies.map((tmdbMovie: any) => 
          tmdbService['convertTMDBMovieToMovie'](tmdbMovie)
        )
      );

      return convertedMovies;
    } catch (error) {
      console.error('Failed to get similar movies:', error);
      return [];
    }
  }

  async updateMovieMetadata(movieId: string): Promise<Movie | null> {
    try {
      const movie = await db.getMovieById(movieId);
      if (!movie || !movie.tmdbId) {
        return null;
      }

      const updatedMovie = await tmdbService.getMovieDetails(movie.tmdbId);
      
      const mergedMovie: Movie = {
        ...movie,
        ...updatedMovie,
        id: movie.id,
      };

      await db.updateMovie(movieId, mergedMovie);
      return mergedMovie;
    } catch (error) {
      console.error('Failed to update movie metadata:', error);
      return null;
    }
  }

  async findMissingMovieData(): Promise<{
    moviesWithoutImages: Movie[];
    moviesWithoutTMDBId: Movie[];
    moviesWithoutDirector: Movie[];
    moviesWithoutActors: Movie[];
  }> {
    const { movies } = await db.getMovies(1, 1000);
    
    return {
      moviesWithoutImages: movies.filter(movie => !movie.imageUrl),
      moviesWithoutTMDBId: movies.filter(movie => !movie.tmdbId),
      moviesWithoutDirector: movies.filter(movie => !movie.director),
      moviesWithoutActors: movies.filter(movie => !movie.actors || movie.actors.length === 0),
    };
  }
}

export const movieEnrichmentService = new MovieEnrichmentService();