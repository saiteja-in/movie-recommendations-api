# TMDB Integration Guide

This document explains how the TMDB (The Movie Database) integration works in the Movie Recommendation System.

## Overview

The TMDB integration provides:
- External movie data source with rich metadata
- Movie search and discovery
- Automatic movie import and enrichment
- Image and poster URLs
- Cast, director, and production information
- Movie recommendations and similar movies

## Setup

1. **Get TMDB API Key**
   - Visit https://www.themoviedb.org/settings/api
   - Create an account and request an API key
   - Copy your API key

2. **Configure Environment**
   ```bash
   # Add to your .env file
   TMDB_API_KEY=your-actual-api-key-here
   ```

3. **Restart Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Search Movies
```http
GET /api/tmdb/search?query=Marvel&page=1
```
Search for movies on TMDB by title.

#### Get Popular Movies
```http
GET /api/tmdb/popular?page=1
```
Get currently popular movies from TMDB.

#### Get Top Rated Movies
```http
GET /api/tmdb/top-rated?page=1
```
Get highest-rated movies from TMDB.

#### Get Trending Movies
```http
GET /api/tmdb/trending?timeWindow=week
```
Get trending movies (day or week).

#### Get Genres
```http
GET /api/tmdb/genres
```
Get all available movie genres.

#### Get Movies by Genre
```http
GET /api/tmdb/genre/28?page=1
```
Get movies by specific genre ID (28 = Action).

### Protected Endpoints (Authentication Required)

#### Import Single Movie
```http
POST /api/tmdb/import/27205
Authorization: Bearer your-jwt-token
```
Import a specific movie by TMDB ID into your local database.

#### Bulk Import Popular Movies
```http
POST /api/tmdb/import/popular?limit=20
Authorization: Bearer your-jwt-token
```
Import multiple popular movies at once (use carefully - rate limited).

## Movie Enrichment

### Automatic Enrichment Endpoints

#### Analyze Missing Data
```http
GET /api/enrichment/analysis/missing-data
```
Analyze what movie data is missing in your database.

#### Get Movie Recommendations
```http
GET /api/enrichment/movies/{movieId}/recommendations?limit=5
```
Get TMDB-powered recommendations for a specific movie.

#### Get Similar Movies
```http
GET /api/enrichment/movies/{movieId}/similar?limit=5
```
Get movies similar to a specific movie.

#### Enrich Single Movie
```http
POST /api/enrichment/movies/{movieId}/enrich
Authorization: Bearer your-jwt-token
```
Automatically enrich a movie with TMDB data.

#### Update Movie Metadata
```http
PUT /api/enrichment/movies/{movieId}/metadata
Authorization: Bearer your-jwt-token
```
Update movie with latest TMDB information.

#### Bulk Enrich All Movies
```http
POST /api/enrichment/movies/enrich-all
Authorization: Bearer your-jwt-token
```
⚠️ **Warning**: This enriches ALL movies in your database. Use sparingly due to TMDB rate limits.

## Data Structure

### TMDB Movie Data Includes:
- **Basic Info**: Title, description, release year
- **Ratings**: TMDB average rating and vote count
- **Cast & Crew**: Director and top 5 actors
- **Production**: Runtime, language, country
- **Images**: Poster and backdrop URLs
- **IDs**: TMDB ID and IMDb ID for cross-referencing

### Example Enriched Movie:
```json
{
  "id": "local_movie_id",
  "title": "Inception",
  "genre": ["action", "sci-fi", "thriller"],
  "year": 2010,
  "description": "A thief who enters people's dreams...",
  "director": "Christopher Nolan",
  "actors": ["Leonardo DiCaprio", "Marion Cotillard"],
  "rating": 8.8,
  "runtime": 148,
  "language": "English",
  "country": "USA",
  "imageUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
  "tmdbId": 27205,
  "imdbId": "tt1375666"
}
```

## Rate Limits

TMDB API has rate limits:
- **40 requests per 10 seconds**
- **1000 requests per day** (for free accounts)

The integration includes:
- Automatic rate limiting respect
- Error handling for rate limit exceeded
- Batch processing with delays
- Graceful fallbacks

## Best Practices

### 1. Search Before Import
Always search TMDB first to find the correct movie:
```http
GET /api/tmdb/search?query=The Matrix
# Find the right movie with correct TMDB ID
POST /api/tmdb/import/603  # The Matrix (1999)
```

### 2. Use Bulk Import Carefully
```http
# Start small
POST /api/tmdb/import/popular?limit=10

# Check results before importing more
GET /api/movies?limit=20
```

### 3. Regular Enrichment
```http
# Check what needs enrichment
GET /api/enrichment/analysis/missing-data

# Enrich specific movies that need it
POST /api/enrichment/movies/{movieId}/enrich
```

### 4. Monitor Rate Limits
- Use the enrichment endpoints sparingly
- Spread bulk operations across time
- Monitor server logs for rate limit warnings

## Error Handling

### Common Errors:

#### TMDB API Not Configured
```json
{
  "success": false,
  "error": "TMDB API is not configured. Please add TMDB_API_KEY to environment variables."
}
```
**Solution**: Add TMDB_API_KEY to your .env file.

#### Movie Already Exists
```json
{
  "success": false,
  "error": "Movie already exists in database"
}
```
**Solution**: Movie is already imported. Use update endpoints instead.

#### Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```
**Solution**: Wait and retry. Consider reducing request frequency.

#### Invalid TMDB ID
```json
{
  "success": false,
  "error": "Failed to get movie details for TMDB ID 999999"
}
```
**Solution**: Verify the TMDB ID exists by searching first.

## Testing

Use the provided HTTP test files:
- `requests/tmdb-integration.http` - Full TMDB testing
- `requests/enrichment-testing.http` - Enrichment testing

## Integration Workflow

### Recommended Setup Flow:
1. **Configure TMDB API key** in .env
2. **Import some popular movies** to seed database
3. **Test search functionality** with imported movies
4. **Use enrichment** to fill in missing data
5. **Set up regular enrichment** for new movies

### Example Complete Workflow:
```http
# 1. Import popular movies
POST /api/tmdb/import/popular?limit=50

# 2. Check what was imported
GET /api/movies?limit=10

# 3. Analyze missing data
GET /api/enrichment/analysis/missing-data

# 4. Get recommendations for a movie
GET /api/enrichment/movies/{movieId}/recommendations

# 5. Test the recommendation system
GET /api/recommendations?algorithm=hybrid
```

This integration provides a robust foundation for a movie recommendation system with rich, up-to-date movie data from TMDB.