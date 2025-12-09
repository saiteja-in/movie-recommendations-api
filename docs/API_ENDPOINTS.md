# API Endpoints Documentation

## Overview

This is a RESTful API for a movie recommendation system built with Express.js and TypeScript. The API provides endpoints for user authentication, movie management, ratings, recommendations, watchlists, and integration with The Movie Database (TMDB).

## Base URL

- **Production**: `https://api.teja.live`
- **Local Development**: `http://localhost:3000`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained via the `/api/auth/login` endpoint and expire after 24 hours.

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Recommendations**: 10 requests per minute per IP
- **Movie Creation**: 10 requests per hour per IP

## Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "data": {...},
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

## Endpoints

---

## 1. Health Check

### GET `/health`

Check if the API is running.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "message": "Movie Recommendation API is running"
}
```

---

## 2. Authentication Endpoints

### POST `/api/auth/register`

Register a new user account.

**Authentication**: Not required (but rate limited)

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "preferences": {
    "likedGenres": ["action", "sci-fi"],
    "dislikedGenres": ["horror"],
    "preferredYearRange": {
      "min": 2000,
      "max": 2024
    }
  }
}
```

**Validation**:
- `username`: 3-50 characters
- `email`: Valid email format
- `password`: Minimum 6 characters

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1234567890",
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Responses**:
- `400`: Validation errors
- `409`: Email or username already exists
- `429`: Too many requests

---

### POST `/api/auth/login`

Authenticate and receive JWT token.

**Authentication**: Not required (but rate limited)

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1234567890",
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `429`: Too many requests

---

### GET `/api/auth/profile`

Get current user's profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `401`: Not authenticated
- `404`: User not found

---

## 3. Movie Endpoints

### GET `/api/movies`

Get paginated list of movies.

**Authentication**: Not required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example**: `GET /api/movies?page=1&limit=20`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "clx1234567890",
        "title": "The Matrix",
        "genre": ["action", "sci-fi"],
        "year": 1999,
        "description": "A computer hacker learns about the true nature of reality...",
        "director": "Lana Wachowski",
        "actors": ["Keanu Reeves", "Laurence Fishburne"],
        "rating": 8.7,
        "imageUrl": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        "runtime": 136,
        "language": "English",
        "country": "USA",
        "tmdbId": 603,
        "imdbId": "tt0133093",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### GET `/api/movies/search`

Search movies with filters.

**Authentication**: Not required

**Query Parameters**:
- `query` (optional): Search in title, description, director
- `genre` (optional): Filter by genre
- `year` (optional): Filter by release year
- `director` (optional): Filter by director name
- `minRating` (optional): Minimum rating (0-10)
- `maxRating` (optional): Maximum rating (0-10)
- `language` (optional): Filter by language
- `country` (optional): Filter by country
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example**: `GET /api/movies/search?genre=action&year=2020&minRating=7&page=1`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "Found 45 movies in database"
}
```

---

### GET `/api/movies/:id`

Get movie by ID.

**Authentication**: Not required

**Path Parameters**:
- `id`: Movie ID (CUID)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "The Matrix",
    ...
  }
}
```

**Error Responses**:
- `400`: Invalid movie ID
- `404`: Movie not found

---

### POST `/api/movies`

Create a new movie.

**Authentication**: Required (rate limited)

**Request Body**:
```json
{
  "title": "Inception",
  "genre": ["sci-fi", "thriller"],
  "year": 2010,
  "description": "A skilled thief is given a chance at redemption...",
  "director": "Christopher Nolan",
  "actors": ["Leonardo DiCaprio", "Marion Cotillard"],
  "rating": 8.8,
  "imageUrl": "https://example.com/poster.jpg",
  "runtime": 148,
  "language": "English",
  "country": "USA",
  "imdbId": "tt1375666",
  "tmdbId": 27205
}
```

**Validation**:
- `title`: Required, 1-200 characters
- `genre`: Required, array with at least 1 genre
- `year`: Required, 1800 to current year + 5
- `description`: Required, 10-1000 characters

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "clx9876543210",
    "title": "Inception",
    ...
  },
  "message": "Movie created successfully"
}
```

**Error Responses**:
- `400`: Validation errors
- `401`: Not authenticated
- `429`: Too many requests

---

### PUT `/api/movies/:id`

Update a movie.

**Authentication**: Required

**Path Parameters**:
- `id`: Movie ID

**Request Body**: Same as POST, but all fields optional

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "Updated Title",
    ...
  },
  "message": "Movie updated successfully"
}
```

**Error Responses**:
- `400`: Validation errors
- `401`: Not authenticated
- `404`: Movie not found

---

### DELETE `/api/movies/:id`

Delete a movie.

**Authentication**: Required

**Path Parameters**:
- `id`: Movie ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

**Error Responses**:
- `400`: Invalid movie ID
- `401`: Not authenticated
- `404`: Movie not found

---

## 4. Rating Endpoints

### POST `/api/ratings/movie/:movieId`

Rate a movie (create or update rating).

**Authentication**: Required

**Path Parameters**:
- `movieId`: Movie ID

**Request Body**:
```json
{
  "rating": 5,
  "liked": true,
  "review": "Amazing movie! Highly recommended."
}
```

**Validation**:
- `rating`: Optional, 1-5 stars
- `liked`: Required boolean
- `review`: Optional, max 500 characters

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clx1111111111",
    "userId": "clx1234567890",
    "movieId": "clx9876543210",
    "rating": 5,
    "liked": true,
    "review": "Amazing movie! Highly recommended.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Movie rated successfully"
}
```

**Error Responses**:
- `400`: Validation errors
- `401`: Not authenticated
- `404`: Movie not found

---

### GET `/api/ratings/user`

Get current user's ratings.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx1111111111",
      "userId": "clx1234567890",
      "movieId": "clx9876543210",
      "rating": 5,
      "liked": true,
      "review": "Great movie!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/ratings/movie/:movieId`

Get all ratings for a movie.

**Authentication**: Not required

**Path Parameters**:
- `movieId`: Movie ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "id": "clx1111111111",
        "userId": "clx1234567890",
        "movieId": "clx9876543210",
        "rating": 5,
        "liked": true,
        "review": "Amazing!",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "averageRating": 4.5,
    "totalRatings": 10
  }
}
```

---

## 5. Recommendation Endpoints

### GET `/api/recommendations`

Get personalized movie recommendations.

**Authentication**: Required (rate limited)

**Query Parameters**:
- `algorithm` (optional): `hybrid` (default), `collaborative`, `content`, or `ai`
- `limit` (optional): Number of recommendations (default: 10, max: 50)
- `genres` (optional): Array of preferred genres
- `excludeWatched` (optional): Exclude watched movies (default: true)
- `minYear` (optional): Minimum release year
- `maxYear` (optional): Maximum release year

**Example**: `GET /api/recommendations?algorithm=hybrid&limit=20`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "movie": {
        "id": "clx9876543210",
        "title": "The Matrix Reloaded",
        "genre": ["action", "sci-fi"],
        "year": 2003,
        ...
      },
      "score": 0.85,
      "reason": "Recommended because it shares action, sci-fi genres (collaborative filtering) + content similarity"
    }
  ],
  "message": "Generated 10 hybrid recommendations"
}
```

**Algorithms**:
- **hybrid**: Combines collaborative and content-based filtering (60% collaborative, 40% content)
- **collaborative**: User-based collaborative filtering using Pearson correlation
- **content**: Content-based filtering using genre, director, year similarity
- **ai**: OpenAI GPT-3.5 powered recommendations

**Error Responses**:
- `401`: Not authenticated
- `429`: Too many requests

---

### GET `/api/recommendations/genre/:genre`

Get recommendations for a specific genre.

**Authentication**: Not required

**Path Parameters**:
- `genre`: Genre name (e.g., "action", "sci-fi")

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "movie": {...},
      "score": 0.9,
      "reason": "Popular action movie"
    }
  ],
  "message": "Found 10 action recommendations"
}
```

---

## 6. Watchlist Endpoints

### GET `/api/watchlist`

Get current user's watchlist.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx2222222222",
      "userId": "clx1234567890",
      "movieId": "clx9876543210",
      "priority": "high",
      "notes": "Must watch this weekend",
      "addedAt": "2024-01-01T00:00:00.000Z",
      "movie": {
        "id": "clx9876543210",
        "title": "Inception",
        ...
      }
    }
  ]
}
```

---

### POST `/api/watchlist/:movieId`

Add movie to watchlist.

**Authentication**: Required

**Path Parameters**:
- `movieId`: Movie ID

**Request Body**:
```json
{
  "priority": "high",
  "notes": "Must watch this weekend"
}
```

**Validation**:
- `priority`: Optional, one of "low", "medium", "high" (default: "medium")
- `notes`: Optional, max 200 characters

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "clx2222222222",
    "userId": "clx1234567890",
    "movieId": "clx9876543210",
    "priority": "high",
    "notes": "Must watch this weekend",
    "addedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Movie added to watchlist"
}
```

**Error Responses**:
- `400`: Validation errors
- `401`: Not authenticated
- `404`: Movie not found

---

### DELETE `/api/watchlist/:movieId`

Remove movie from watchlist.

**Authentication**: Required

**Path Parameters**:
- `movieId`: Movie ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Movie removed from watchlist"
}
```

---

## 7. TMDB Integration Endpoints

### GET `/api/tmdb/search`

Search movies in TMDB database.

**Authentication**: Not required

**Query Parameters**:
- `query` (required): Search query
- `page` (optional): Page number (default: 1)

**Example**: `GET /api/tmdb/search?query=matrix&page=1`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "tmdb_603",
        "title": "The Matrix",
        "tmdbId": 603,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  },
  "message": "Found 100 movies"
}
```

**Error Responses**:
- `400`: Missing query parameter
- `503`: TMDB API not configured

---

### GET `/api/tmdb/popular`

Get popular movies from TMDB.

**Authentication**: Not required

**Query Parameters**:
- `page` (optional): Page number (default: 1)

**Response**: Same format as search

---

### GET `/api/tmdb/top-rated`

Get top-rated movies from TMDB.

**Authentication**: Not required

**Query Parameters**:
- `page` (optional): Page number (default: 1)

---

### GET `/api/tmdb/trending`

Get trending movies from TMDB.

**Authentication**: Not required

**Query Parameters**:
- `timeWindow` (optional): `day` or `week` (default: `week`)

---

### GET `/api/tmdb/genres`

Get all available genres from TMDB.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 12,
      "name": "Adventure"
    }
  ]
}
```

---

### GET `/api/tmdb/genre/:genreId`

Get movies by genre from TMDB.

**Authentication**: Not required

**Path Parameters**:
- `genreId`: TMDB genre ID (number)

**Query Parameters**:
- `page` (optional): Page number (default: 1)

---

### POST `/api/tmdb/import/:tmdbId`

Import a movie from TMDB into local database.

**Authentication**: Required

**Path Parameters**:
- `tmdbId`: TMDB movie ID (number)

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "clx9876543210",
    "title": "The Matrix",
    "tmdbId": 603,
    ...
  },
  "message": "Movie imported successfully from TMDB"
}
```

**Error Responses**:
- `400`: Invalid TMDB ID
- `401`: Not authenticated
- `409`: Movie already exists

---

### POST `/api/tmdb/import/popular`

Bulk import popular movies from TMDB.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of movies to import (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "imported": 15,
    "skipped": 5
  },
  "message": "Imported 15 movies, skipped 5 (already exist or failed)"
}
```

---

## 8. Movie Enrichment Endpoints

### POST `/api/enrichment/movies/:movieId/enrich`

Enrich a movie with TMDB data.

**Authentication**: Required

**Path Parameters**:
- `movieId`: Movie ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clx9876543210",
    "title": "The Matrix",
    "tmdbId": 603,
    "imageUrl": "https://image.tmdb.org/t/p/w500/...",
    ...
  },
  "message": "Movie enriched successfully"
}
```

---

### POST `/api/enrichment/movies/enrich-all`

Enrich all movies in database with TMDB data.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "enriched": 50,
    "failed": 5,
    "total": 100
  },
  "message": "Enrichment complete: 50 enriched, 5 failed out of 100 total movies"
}
```

---

### GET `/api/enrichment/movies/:movieId/recommendations`

Get TMDB recommendations for a movie.

**Authentication**: Not required

**Path Parameters**:
- `movieId`: Movie ID

**Query Parameters**:
- `limit` (optional): Number of recommendations (default: 5)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "tmdb_604",
      "title": "The Matrix Reloaded",
      ...
    }
  ],
  "message": "Found 5 recommendations"
}
```

---

### GET `/api/enrichment/movies/:movieId/similar`

Get similar movies from TMDB.

**Authentication**: Not required

**Path Parameters**:
- `movieId`: Movie ID

**Query Parameters**:
- `limit` (optional): Number of similar movies (default: 5)

---

### PUT `/api/enrichment/movies/:movieId/metadata`

Update movie metadata from TMDB.

**Authentication**: Required

**Path Parameters**:
- `movieId`: Movie ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clx9876543210",
    "title": "The Matrix",
    ...
  },
  "message": "Movie metadata updated successfully"
}
```

---

### GET `/api/enrichment/analysis/missing-data`

Analyze missing movie data.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "moviesWithoutImages": 10,
    "moviesWithoutTMDBId": 25,
    "moviesWithoutDirector": 15,
    "moviesWithoutActors": 8,
    "details": {
      "moviesWithoutImages": [...],
      "moviesWithoutTMDBId": [...],
      ...
    }
  },
  "message": "Missing movie data analysis complete"
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation errors) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (expired token) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `429` | Too Many Requests (rate limit exceeded) |
| `500` | Internal Server Error |
| `503` | Service Unavailable (external service down) |

## Pagination

Paginated responses include pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Filtering and Sorting

- **Movies**: Sorted by `createdAt` (newest first) or `rating` (highest first)
- **Ratings**: Sorted by `createdAt` (newest first)
- **Watchlist**: Sorted by `addedAt` (newest first)

## Rate Limit Headers

Rate-limited endpoints include headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1704067200
```

## Summary

The API provides:
- **User Management**: Registration, login, profiles
- **Movie Catalog**: CRUD operations, search, filtering
- **Rating System**: User ratings and reviews
- **Recommendations**: Multiple algorithms (collaborative, content-based, AI, hybrid)
- **Watchlist**: Personal movie lists
- **TMDB Integration**: Search, import, and enrich movies
- **Data Enrichment**: Automatic metadata updates from TMDB

