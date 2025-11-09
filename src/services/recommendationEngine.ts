import { Movie, User, Rating, Recommendation } from '../types';
import { db } from './database';

export class RecommendationEngine {
  // Collaborative Filtering - User-based recommendations
  static async generateCollaborativeRecommendations(
    targetUserId: string,
    allMovies: Movie[],
    limit = 10
  ): Promise<Recommendation[]> {
    try {
      const allRatings = await db.getAllRatings();
      const allUsers = await db.getAllUsers();
      
      const targetUserRatings = allRatings.filter(r => r.userId === targetUserId);
      if (targetUserRatings.length === 0) {
        return this.getPopularMovies(allMovies, limit);
      }

      // Find similar users based on rating correlation
      const similarUsers = this.findSimilarUsers(targetUserId, allRatings, allUsers);
      
      // Get movie recommendations from similar users
      const recommendations = this.getRecommendationsFromSimilarUsers(
        targetUserId,
        similarUsers,
        allRatings,
        allMovies,
        limit
      );

      return recommendations;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return this.getPopularMovies(allMovies, limit);
    }
  }

  // Content-based filtering using movie attributes
  static async generateContentBasedRecommendations(
    targetUserId: string,
    allMovies: Movie[],
    limit = 10
  ): Promise<Recommendation[]> {
    try {
      const userRatings = await db.getUserRatings(targetUserId);
      const likedMovies: Movie[] = [];
      
      for (const rating of userRatings.filter(r => r.liked && r.rating >= 4)) {
        const movie = await db.getMovieById(rating.movieId);
        if (movie) likedMovies.push(movie);
      }

      if (likedMovies.length === 0) {
        return this.getPopularMovies(allMovies, limit);
      }

      // Calculate content similarity scores
      const recommendations = allMovies
        .filter(movie => !userRatings.some(r => r.movieId === movie.id))
        .map(movie => {
          const similarity = this.calculateContentSimilarity(movie, likedMovies);
          return {
            movie,
            score: similarity,
            reason: this.generateContentReason(movie, likedMovies),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return this.getPopularMovies(allMovies, limit);
    }
  }

  // Hybrid approach combining collaborative and content-based
  static async generateHybridRecommendations(
    targetUserId: string,
    allMovies: Movie[],
    limit = 10
  ): Promise<Recommendation[]> {
    try {
      const collaborativeRecs = await this.generateCollaborativeRecommendations(
        targetUserId, 
        allMovies, 
        Math.ceil(limit * 0.6)
      );
      
      const contentBasedRecs = await this.generateContentBasedRecommendations(
        targetUserId, 
        allMovies, 
        Math.ceil(limit * 0.4)
      );

      // Combine and deduplicate
      const combinedRecs = new Map<string, Recommendation>();
      
      collaborativeRecs.forEach(rec => {
        combinedRecs.set(rec.movie.id, {
          ...rec,
          score: rec.score * 0.6, // Weight collaborative filtering
          reason: `${rec.reason} (collaborative filtering)`,
        });
      });

      contentBasedRecs.forEach(rec => {
        const existing = combinedRecs.get(rec.movie.id);
        if (existing) {
          // Boost score if recommended by both methods
          existing.score = (existing.score + rec.score * 0.4) / 1.4;
          existing.reason = `${existing.reason} + content similarity`;
        } else {
          combinedRecs.set(rec.movie.id, {
            ...rec,
            score: rec.score * 0.4, // Weight content-based filtering
            reason: `${rec.reason} (content-based)`,
          });
        }
      });

      return Array.from(combinedRecs.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      return this.getPopularMovies(allMovies, limit);
    }
  }

  // Calculate similarity between users using Pearson correlation
  private static calculateUserSimilarity(
    user1Ratings: Rating[],
    user2Ratings: Rating[]
  ): number {
    const commonMovies = user1Ratings.filter(r1 =>
      user2Ratings.some(r2 => r2.movieId === r1.movieId)
    );

    if (commonMovies.length < 2) return 0; // Need at least 2 common ratings

    const user1CommonRatings = commonMovies.map(r => r.rating);
    const user2CommonRatings = commonMovies.map(r1 => {
      const r2 = user2Ratings.find(r2 => r2.movieId === r1.movieId);
      return r2 ? r2.rating : 0;
    });

    // Calculate Pearson correlation coefficient
    const n = user1CommonRatings.length;
    const sum1 = user1CommonRatings.reduce((a, b) => a + b, 0);
    const sum2 = user2CommonRatings.reduce((a, b) => a + b, 0);
    const sum1Sq = user1CommonRatings.reduce((a, b) => a + b * b, 0);
    const sum2Sq = user2CommonRatings.reduce((a, b) => a + b * b, 0);
    const pSum = user1CommonRatings.reduce((acc, r1, i) => acc + r1 * user2CommonRatings[i], 0);

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return den === 0 ? 0 : num / den;
  }

  private static findSimilarUsers(
    targetUserId: string,
    allRatings: Rating[],
    allUsers: User[]
  ): Array<{ user: User; similarity: number }> {
    const targetUserRatings = allRatings.filter(r => r.userId === targetUserId);
    
    return allUsers
      .filter(user => user.id !== targetUserId)
      .map(user => {
        const userRatings = allRatings.filter(r => r.userId === user.id);
        const similarity = this.calculateUserSimilarity(targetUserRatings, userRatings);
        return { user, similarity };
      })
      .filter(item => item.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 similar users
  }

  private static getRecommendationsFromSimilarUsers(
    targetUserId: string,
    similarUsers: Array<{ user: User; similarity: number }>,
    allRatings: Rating[],
    allMovies: Movie[],
    limit: number
  ): Recommendation[] {
    const targetUserRatings = allRatings.filter(r => r.userId === targetUserId);
    const watchedMovieIds = new Set(targetUserRatings.map(r => r.movieId));

    const movieScores = new Map<string, { score: number; count: number }>();

    similarUsers.forEach(({ user, similarity }) => {
      const userRatings = allRatings.filter(r => 
        r.userId === user.id && 
        r.liked && 
        r.rating >= 4 &&
        !watchedMovieIds.has(r.movieId)
      );

      userRatings.forEach(rating => {
        const current = movieScores.get(rating.movieId) || { score: 0, count: 0 };
        movieScores.set(rating.movieId, {
          score: current.score + (rating.rating * similarity),
          count: current.count + 1,
        });
      });
    });

    const recommendations: Recommendation[] = [];
    
    for (const [movieId, { score, count }] of movieScores) {
      const movie = allMovies.find(m => m.id === movieId);
      if (movie) {
        recommendations.push({
          movie,
          score: score / count, // Average weighted score
          reason: `Recommended by ${count} similar user${count > 1 ? 's' : ''}`,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private static calculateContentSimilarity(movie: Movie, likedMovies: Movie[]): number {
    let totalSimilarity = 0;

    likedMovies.forEach(likedMovie => {
      let similarity = 0;

      // Genre similarity (weighted heavily)
      const genreOverlap = movie.genre.filter(g => likedMovie.genre.includes(g)).length;
      const genreUnion = new Set([...movie.genre, ...likedMovie.genre]).size;
      similarity += (genreOverlap / genreUnion) * 0.5;

      // Director similarity
      if (movie.director && likedMovie.director && movie.director === likedMovie.director) {
        similarity += 0.2;
      }

      // Year proximity
      const yearDiff = Math.abs(movie.year - likedMovie.year);
      if (yearDiff <= 5) {
        similarity += 0.15;
      } else if (yearDiff <= 15) {
        similarity += 0.1;
      }

      // Rating similarity
      if (movie.rating && likedMovie.rating) {
        const ratingDiff = Math.abs(movie.rating - likedMovie.rating);
        if (ratingDiff <= 1) {
          similarity += 0.15;
        }
      }

      totalSimilarity += similarity;
    });

    return likedMovies.length > 0 ? totalSimilarity / likedMovies.length : 0;
  }

  private static generateContentReason(movie: Movie, likedMovies: Movie[]): string {
    const reasons = [];

    // Find common genres
    const commonGenres = movie.genre.filter(g => 
      likedMovies.some(liked => liked.genre.includes(g))
    );
    if (commonGenres.length > 0) {
      reasons.push(`shares ${commonGenres.join(', ')} genre${commonGenres.length > 1 ? 's' : ''}`);
    }

    // Find common directors
    const commonDirectors = likedMovies.filter(liked => 
      movie.director && liked.director === movie.director
    );
    if (commonDirectors.length > 0) {
      reasons.push(`same director as liked movies`);
    }

    return reasons.length > 0 
      ? `Recommended because it ${reasons.join(' and ')}`
      : 'Similar to your preferences';
  }

  private static getPopularMovies(allMovies: Movie[], limit: number): Recommendation[] {
    return allMovies
      .filter(movie => movie.rating && movie.rating >= 7)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
      .map((movie, index) => ({
        movie,
        score: 0.8 - (index * 0.05),
        reason: 'Popular highly-rated movie',
      }));
  }
}