# Movie Recommendation API 🎬

An AI-powered movie recommendation system built with Express.js, TypeScript, and OpenAI.

## Features

- **User Authentication**: JWT-based user registration and login
- **Movie Management**: CRUD operations for movies with search functionality
- **Rating System**: Users can rate and like movies
- **AI Recommendations**: Personalized movie suggestions using OpenAI GPT
- **Genre-based Recommendations**: Get recommendations by specific genres

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/search` - Search movies by title, genre, or year
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Add new movie (requires auth)

### Ratings
- `POST /api/ratings/movie/:movieId` - Rate a movie (requires auth)
- `GET /api/ratings/user` - Get user's ratings (requires auth)
- `GET /api/ratings/movie/:movieId` - Get movie ratings

### Recommendations
- `GET /api/recommendations` - Get AI-powered recommendations (requires auth)
- `GET /api/recommendations/genre/:genre` - Get genre-based recommendations

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key and other settings
```

3. **Load sample data**:
```bash
npm run seed
```

4. **Start development server**:
```bash
npm run dev
```

5. **Test the API**:
```bash
curl http://localhost:3000/health
```

## Example Usage

### Register a user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "moviefan",
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Rate a movie:
```bash
curl -X POST http://localhost:3000/api/ratings/movie/movie_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 5,
    "liked": true
  }'
```

### Get recommendations:
```bash
curl -X GET http://localhost:3000/api/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Scripts

- `npm run build` - Build the project
- `npm run start` - Start production server
- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed` - Load sample movie data

## Project Structure

```
src/
├── controllers/     # Request handlers
├── models/         # Data models and validation
├── services/       # Business logic (AI service)
├── routes/         # API routes
├── middleware/     # Authentication, validation
├── utils/          # Database utilities
├── types/          # TypeScript type definitions
└── scripts/        # Utility scripts
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for recommendations
- `NODE_ENV` - Environment (development/production)

## Technologies

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **OpenAI** - AI-powered recommendations
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Input validation