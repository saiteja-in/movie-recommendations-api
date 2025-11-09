export interface Movie {
  id: string;
  title: string;
  genre: string[];
  year: number;
  description: string;
  director?: string;
  actors?: string[];
  rating?: number;
  imageUrl?: string;
  runtime?: number; // in minutes
  language?: string;
  country?: string;
  imdbId?: string;
  tmdbId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  preferences?: MoviePreferences;
}

export interface MoviePreferences {
  likedGenres: string[];
  dislikedGenres: string[];
  preferredYearRange?: {
    min: number;
    max: number;
  };
}

export interface Rating {
  id: string;
  userId: string;
  movieId: string;
  rating: number; // 1-5 stars
  liked: boolean;
  review?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Recommendation {
  movie: Movie;
  score: number;
  reason: string;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  movieId: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  addedAt: Date;
}

export interface UserStats {
  totalRatings: number;
  averageRating: number;
  favoriteGenres: string[];
  watchlistCount: number;
  topRatedMovies: Movie[];
}

export interface RecommendationRequest {
  limit?: number;
  genres?: string[];
  excludeWatched?: boolean;
  minYear?: number;
  maxYear?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}