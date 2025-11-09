import axios, { AxiosInstance } from 'axios';
import { Movie } from '../types';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string }[];
    crew: { id: number; name: string; job: string }[];
  };
  imdb_id?: string;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export class TMDBService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private imageBaseUrl: string;
  private genreMap: Map<number, string> = new Map();

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    this.baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    this.imageBaseUrl = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';

    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        api_key: this.apiKey,
      },
      timeout: 10000,
    });

    // Initialize genre map
    this.initializeGenres();
  }

  private async initializeGenres(): Promise<void> {
    try {
      const response = await this.client.get<{ genres: TMDBGenre[] }>('/genre/movie/list');
      response.data.genres.forEach(genre => {
        this.genreMap.set(genre.id, genre.name.toLowerCase());
      });
    } catch (error) {
      console.error('Failed to load TMDB genres:', error);
    }
  }

  // Search for movies
  async searchMovies(query: string, page = 1): Promise<{
    movies: Movie[];
    totalPages: number;
    totalResults: number;
  }> {
    try {
      const response = await this.client.get<TMDBSearchResponse>('/search/movie', {
        params: {
          query,
          page,
          include_adult: false,
        },
      });

      const movies = await Promise.all(
        response.data.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
      );

      return {
        movies,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB search error:', error);
      throw new Error('Failed to search movies from TMDB');
    }
  }

  // Get movie details by TMDB ID
  async getMovieDetails(tmdbId: number): Promise<Movie> {
    try {
      const response = await this.client.get<TMDBMovie>(`/movie/${tmdbId}`, {
        params: {
          append_to_response: 'credits',
        },
      });

      return this.convertTMDBMovieToMovie(response.data);
    } catch (error) {
      console.error('TMDB get movie details error:', error);
      throw new Error(`Failed to get movie details for TMDB ID ${tmdbId}`);
    }
  }

  // Get popular movies
  async getPopularMovies(page = 1): Promise<{
    movies: Movie[];
    totalPages: number;
    totalResults: number;
  }> {
    try {
      const response = await this.client.get<TMDBSearchResponse>('/movie/popular', {
        params: { page },
      });

      const movies = await Promise.all(
        response.data.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
      );

      return {
        movies,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB get popular movies error:', error);
      throw new Error('Failed to get popular movies from TMDB');
    }
  }

  // Get top rated movies
  async getTopRatedMovies(page = 1): Promise<{
    movies: Movie[];
    totalPages: number;
    totalResults: number;
  }> {
    try {
      const response = await this.client.get<TMDBSearchResponse>('/movie/top_rated', {
        params: { page },
      });

      const movies = await Promise.all(
        response.data.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
      );

      return {
        movies,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB get top rated movies error:', error);
      throw new Error('Failed to get top rated movies from TMDB');
    }
  }

  // Get movies by genre
  async getMoviesByGenre(genreId: number, page = 1): Promise<{
    movies: Movie[];
    totalPages: number;
    totalResults: number;
  }> {
    try {
      const response = await this.client.get<TMDBSearchResponse>('/discover/movie', {
        params: {
          with_genres: genreId,
          page,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100, // Only movies with at least 100 votes
        },
      });

      const movies = await Promise.all(
        response.data.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
      );

      return {
        movies,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB get movies by genre error:', error);
      throw new Error(`Failed to get movies for genre ${genreId} from TMDB`);
    }
  }

  // Get trending movies
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
    try {
      const response = await this.client.get<TMDBSearchResponse>(`/trending/movie/${timeWindow}`);

      const movies = await Promise.all(
        response.data.results.map(tmdbMovie => this.convertTMDBMovieToMovie(tmdbMovie))
      );

      return movies;
    } catch (error) {
      console.error('TMDB get trending movies error:', error);
      throw new Error('Failed to get trending movies from TMDB');
    }
  }

  // Get genres
  async getGenres(): Promise<{ id: number; name: string }[]> {
    try {
      const response = await this.client.get<{ genres: TMDBGenre[] }>('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('TMDB get genres error:', error);
      throw new Error('Failed to get genres from TMDB');
    }
  }

  // Convert TMDB movie to our Movie interface
  private async convertTMDBMovieToMovie(tmdbMovie: TMDBMovie): Promise<Movie> {
    // Get detailed movie info if we only have basic info
    let detailedMovie = tmdbMovie;
    if (!tmdbMovie.runtime || !tmdbMovie.credits) {
      try {
        const response = await this.client.get<TMDBMovie>(`/movie/${tmdbMovie.id}`, {
          params: {
            append_to_response: 'credits',
          },
        });
        detailedMovie = response.data;
      } catch (error) {
        console.warn(`Failed to get detailed info for movie ${tmdbMovie.id}`);
      }
    }

    // Convert genre IDs to genre names
    const genres = detailedMovie.genre_ids
      ? detailedMovie.genre_ids.map(id => this.genreMap.get(id) || 'unknown').filter(g => g !== 'unknown')
      : detailedMovie.genres?.map(g => g.name.toLowerCase()) || [];

    // Extract director
    const director = detailedMovie.credits?.crew.find(person => person.job === 'Director')?.name;

    // Extract main cast (top 5)
    const actors = detailedMovie.credits?.cast.slice(0, 5).map(actor => actor.name) || [];

    // Extract language and country
    const language = detailedMovie.spoken_languages?.[0]?.english_name || 'English';
    const country = detailedMovie.production_countries?.[0]?.name || 'USA';

    // Build image URL
    const imageUrl = detailedMovie.poster_path 
      ? `${this.imageBaseUrl}${detailedMovie.poster_path}`
      : undefined;

    return {
      id: `tmdb_${detailedMovie.id}`, // Prefix with tmdb_ to avoid ID conflicts
      title: detailedMovie.title,
      genre: genres,
      year: new Date(detailedMovie.release_date || '1900-01-01').getFullYear(),
      description: detailedMovie.overview,
      director,
      actors,
      rating: Math.round(detailedMovie.vote_average * 10) / 10, // Round to 1 decimal
      imageUrl,
      runtime: detailedMovie.runtime,
      language,
      country,
      tmdbId: detailedMovie.id,
      imdbId: detailedMovie.imdb_id,
    };
  }

  // Check if TMDB is available
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-tmdb-api-key-here';
  }

  // Get configuration info
  getImageUrl(path: string, size: string = 'w500'): string {
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();