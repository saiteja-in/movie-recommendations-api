import { PrismaClient } from '@prisma/client';
import { Movie, User, Rating, WatchlistItem } from '../types';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const dbUser = await this.prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      },
    });
    return this.convertDbUserToUser(dbUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id },
    });
    return dbUser ? this.convertDbUserToUser(dbUser) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return dbUser ? this.convertDbUserToUser(dbUser) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { username },
    });
    return dbUser ? this.convertDbUserToUser(dbUser) : null;
  }

  // Movie operations
  async getMovies(page?: number, limit?: number): Promise<{ movies: Movie[]; total: number }> {
    const where = {};
    const total = await this.prisma.movie.count({ where });
    
    const dbMovies = await this.prisma.movie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: page && limit ? (page - 1) * limit : undefined,
      take: limit,
    });

    const movies = dbMovies.map(this.convertDbMovieToMovie);
    return { movies, total };
  }

  async getMovieById(id: string): Promise<Movie | null> {
    const dbMovie = await this.prisma.movie.findUnique({
      where: { id },
    });
    return dbMovie ? this.convertDbMovieToMovie(dbMovie) : null;
  }

  async createMovie(movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>): Promise<Movie> {
    const dbMovie = await this.prisma.movie.create({
      data: {
        title: movieData.title,
        genre: Array.isArray(movieData.genre) ? movieData.genre.join(',') : movieData.genre,
        year: movieData.year,
        description: movieData.description,
        director: movieData.director,
        actors: Array.isArray(movieData.actors) ? movieData.actors.join(',') : movieData.actors,
        rating: movieData.rating,
        imageUrl: movieData.imageUrl,
        runtime: movieData.runtime,
        language: movieData.language,
        country: movieData.country,
        imdbId: movieData.imdbId,
        tmdbId: movieData.tmdbId,
      },
    });
    return this.convertDbMovieToMovie(dbMovie);
  }

  async updateMovie(id: string, movieData: Partial<Movie>): Promise<Movie> {
    const updateData: any = { ...movieData };
    
    if (movieData.genre) {
      updateData.genre = Array.isArray(movieData.genre) ? movieData.genre.join(',') : movieData.genre;
    }
    if (movieData.actors) {
      updateData.actors = Array.isArray(movieData.actors) ? movieData.actors.join(',') : movieData.actors;
    }

    const dbMovie = await this.prisma.movie.update({
      where: { id },
      data: updateData,
    });
    return this.convertDbMovieToMovie(dbMovie);
  }

  async deleteMovie(id: string): Promise<void> {
    await this.prisma.movie.delete({
      where: { id },
    });
  }

  async searchMovies(searchParams: {
    query?: string;
    genre?: string;
    year?: number;
    director?: string;
    minRating?: number;
    maxRating?: number;
    language?: string;
    country?: string;
    page?: number;
    limit?: number;
  }): Promise<{ movies: Movie[]; total: number }> {
    const where: any = {};

    if (searchParams.query) {
      where.OR = [
        { title: { contains: searchParams.query } },
        { description: { contains: searchParams.query } },
        { director: { contains: searchParams.query } },
      ];
    }

    if (searchParams.genre) {
      where.genre = { contains: searchParams.genre };
    }

    if (searchParams.year) {
      where.year = searchParams.year;
    }

    if (searchParams.director) {
      where.director = { contains: searchParams.director };
    }

    if (searchParams.minRating || searchParams.maxRating) {
      where.rating = {};
      if (searchParams.minRating) where.rating.gte = searchParams.minRating;
      if (searchParams.maxRating) where.rating.lte = searchParams.maxRating;
    }

    if (searchParams.language) {
      where.language = { contains: searchParams.language };
    }

    if (searchParams.country) {
      where.country = { contains: searchParams.country };
    }

    const total = await this.prisma.movie.count({ where });
    
    const dbMovies = await this.prisma.movie.findMany({
      where,
      orderBy: { rating: 'desc' },
      skip: searchParams.page && searchParams.limit ? (searchParams.page - 1) * searchParams.limit : undefined,
      take: searchParams.limit,
    });

    const movies = dbMovies.map(this.convertDbMovieToMovie);
    return { movies, total };
  }

  // Rating operations
  async createOrUpdateRating(ratingData: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rating> {
    const dbRating = await this.prisma.rating.upsert({
      where: {
        userId_movieId: {
          userId: ratingData.userId,
          movieId: ratingData.movieId,
        },
      },
      update: {
        rating: ratingData.rating,
        liked: ratingData.liked,
        review: ratingData.review,
      },
      create: {
        userId: ratingData.userId,
        movieId: ratingData.movieId,
        rating: ratingData.rating,
        liked: ratingData.liked,
        review: ratingData.review,
      },
    });
    return this.convertDbRatingToRating(dbRating);
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    const dbRatings = await this.prisma.rating.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return dbRatings.map(this.convertDbRatingToRating);
  }

  async getMovieRatings(movieId: string): Promise<Rating[]> {
    const dbRatings = await this.prisma.rating.findMany({
      where: { movieId },
      orderBy: { createdAt: 'desc' },
    });
    return dbRatings.map(this.convertDbRatingToRating);
  }

  async getAllRatings(): Promise<Rating[]> {
    const dbRatings = await this.prisma.rating.findMany();
    return dbRatings.map(this.convertDbRatingToRating);
  }

  async getAllUsers(): Promise<User[]> {
    const dbUsers = await this.prisma.user.findMany();
    return dbUsers.map(this.convertDbUserToUser);
  }

  // Watchlist operations
  async addToWatchlist(watchlistData: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<WatchlistItem> {
    const dbWatchlistItem = await this.prisma.watchlistItem.upsert({
      where: {
        userId_movieId: {
          userId: watchlistData.userId,
          movieId: watchlistData.movieId,
        },
      },
      update: {
        priority: watchlistData.priority,
        notes: watchlistData.notes,
      },
      create: {
        userId: watchlistData.userId,
        movieId: watchlistData.movieId,
        priority: watchlistData.priority,
        notes: watchlistData.notes,
      },
    });
    return this.convertDbWatchlistItemToWatchlistItem(dbWatchlistItem);
  }

  async removeFromWatchlist(userId: string, movieId: string): Promise<void> {
    await this.prisma.watchlistItem.delete({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });
  }

  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    const dbWatchlistItems = await this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });
    return dbWatchlistItems.map(this.convertDbWatchlistItemToWatchlistItem);
  }

  // Conversion methods
  private convertDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      createdAt: dbUser.createdAt,
    };
  }

  private convertDbMovieToMovie(dbMovie: any): Movie {
    return {
      id: dbMovie.id,
      title: dbMovie.title,
      genre: dbMovie.genre ? dbMovie.genre.split(',').map((g: string) => g.trim()) : [],
      year: dbMovie.year,
      description: dbMovie.description,
      director: dbMovie.director,
      actors: dbMovie.actors ? dbMovie.actors.split(',').map((a: string) => a.trim()) : [],
      rating: dbMovie.rating,
      imageUrl: dbMovie.imageUrl,
      runtime: dbMovie.runtime,
      language: dbMovie.language,
      country: dbMovie.country,
      imdbId: dbMovie.imdbId,
      tmdbId: dbMovie.tmdbId,
      createdAt: dbMovie.createdAt,
      updatedAt: dbMovie.updatedAt,
    };
  }

  private convertDbRatingToRating(dbRating: any): Rating {
    return {
      id: dbRating.id,
      userId: dbRating.userId,
      movieId: dbRating.movieId,
      rating: dbRating.rating,
      liked: dbRating.liked,
      review: dbRating.review,
      createdAt: dbRating.createdAt,
      updatedAt: dbRating.updatedAt,
    };
  }

  private convertDbWatchlistItemToWatchlistItem(dbWatchlistItem: any): WatchlistItem {
    return {
      id: dbWatchlistItem.id,
      userId: dbWatchlistItem.userId,
      movieId: dbWatchlistItem.movieId,
      priority: dbWatchlistItem.priority as 'low' | 'medium' | 'high',
      notes: dbWatchlistItem.notes,
      addedAt: dbWatchlistItem.addedAt,
    };
  }
}

export const db = DatabaseService.getInstance();