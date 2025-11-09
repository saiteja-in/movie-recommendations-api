import NodeCache from 'node-cache';
import { Movie, Recommendation, User } from '../types';

class CacheService {
  private cache: NodeCache;

  constructor() {
    // Cache with default TTL of 10 minutes
    this.cache = new NodeCache({
      stdTTL: 600, // 10 minutes in seconds
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // For better performance, but be careful with object mutations
    });
  }

  // Movie caching
  setMovies(movies: Movie[], ttl = 600): void {
    this.cache.set('all-movies', movies, ttl);
  }

  getMovies(): Movie[] | undefined {
    return this.cache.get('all-movies');
  }

  setMovie(movieId: string, movie: Movie, ttl = 600): void {
    this.cache.set(`movie-${movieId}`, movie, ttl);
  }

  getMovie(movieId: string): Movie | undefined {
    return this.cache.get(`movie-${movieId}`);
  }

  invalidateMovie(movieId: string): void {
    this.cache.del(`movie-${movieId}`);
    this.cache.del('all-movies'); // Invalidate movies list too
  }

  invalidateAllMovies(): void {
    this.cache.del('all-movies');
    // Remove all individual movie caches
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith('movie-')) {
        this.cache.del(key);
      }
    });
  }

  // User caching
  setUser(userId: string, user: User, ttl = 300): void {
    this.cache.set(`user-${userId}`, user, ttl);
  }

  getUser(userId: string): User | undefined {
    return this.cache.get(`user-${userId}`);
  }

  invalidateUser(userId: string): void {
    this.cache.del(`user-${userId}`);
  }

  // Recommendations caching
  setRecommendations(
    userId: string, 
    algorithm: string, 
    recommendations: Recommendation[], 
    ttl = 1800 // 30 minutes for recommendations
  ): void {
    const key = `recommendations-${userId}-${algorithm}`;
    this.cache.set(key, recommendations, ttl);
  }

  getRecommendations(userId: string, algorithm: string): Recommendation[] | undefined {
    const key = `recommendations-${userId}-${algorithm}`;
    return this.cache.get(key);
  }

  invalidateUserRecommendations(userId: string): void {
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith(`recommendations-${userId}-`)) {
        this.cache.del(key);
      }
    });
  }

  invalidateAllRecommendations(): void {
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith('recommendations-')) {
        this.cache.del(key);
      }
    });
  }

  // Genre recommendations caching
  setGenreRecommendations(genre: string, recommendations: Recommendation[], ttl = 3600): void {
    this.cache.set(`genre-${genre}`, recommendations, ttl);
  }

  getGenreRecommendations(genre: string): Recommendation[] | undefined {
    return this.cache.get(`genre-${genre}`);
  }

  // Search results caching
  setSearchResults(
    query: string, 
    results: Movie[], 
    ttl = 300 // 5 minutes for search results
  ): void {
    const key = `search-${this.hashString(query)}`;
    this.cache.set(key, results, ttl);
  }

  getSearchResults(query: string): Movie[] | undefined {
    const key = `search-${this.hashString(query)}`;
    return this.cache.get(key);
  }

  // AI response caching (to save on OpenAI costs)
  setAIResponse(
    userId: string, 
    likedMovieIds: string[], 
    response: Recommendation[], 
    ttl = 3600 // 1 hour for AI responses
  ): void {
    const key = `ai-${userId}-${this.hashString(likedMovieIds.sort().join(','))}`;
    this.cache.set(key, response, ttl);
  }

  getAIResponse(userId: string, likedMovieIds: string[]): Recommendation[] | undefined {
    const key = `ai-${userId}-${this.hashString(likedMovieIds.sort().join(','))}`;
    return this.cache.get(key);
  }

  // General cache management
  getStats(): { keys: number; hits: number; misses: number } {
    return this.cache.getStats();
  }

  clearAll(): void {
    this.cache.flushAll();
  }

  // Utility methods
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  // Event handlers for cache invalidation
  onMovieUpdate(movieId: string): void {
    this.invalidateMovie(movieId);
    this.invalidateAllRecommendations(); // Movie changes affect recommendations
  }

  onMovieCreate(): void {
    this.invalidateAllMovies();
    this.invalidateAllRecommendations();
  }

  onMovieDelete(movieId: string): void {
    this.invalidateMovie(movieId);
    this.invalidateAllRecommendations();
  }

  onUserRating(userId: string): void {
    this.invalidateUserRecommendations(userId);
  }
}

// Export singleton instance
export const cache = new CacheService();