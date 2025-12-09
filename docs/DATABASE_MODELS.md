# Database Models Documentation

## Overview

This application uses **Prisma ORM** with **PostgreSQL** as the database. Prisma provides type-safe database access and automatic migrations. The database schema is defined in `prisma/schema.prisma`.

## Database Configuration

### Connection
- **Provider**: PostgreSQL
- **Connection String**: Provided via `DATABASE_URL` environment variable
- **Format**: `postgresql://user:password@host:port/database`

### Prisma Client
- Generated automatically during build (`npx prisma generate`)
- Provides type-safe database access
- Used throughout the application via `@prisma/client`

## Schema Models

### 1. User Model

#### Purpose
Stores user account information and authentication data.

#### Schema Definition
```prisma
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  email       String   @unique
  password    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  ratings     Rating[]
  watchlist   WatchlistItem[]

  @@map("users")
}
```

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key, CUID | Unique identifier for the user |
| `username` | String | Unique, Required | User's chosen username |
| `email` | String | Unique, Required | User's email address (used for login) |
| `password` | String | Required | Hashed password (bcrypt) |
| `createdAt` | DateTime | Auto-generated | Timestamp when user was created |
| `updatedAt` | DateTime | Auto-updated | Timestamp when user was last updated |

#### Relations
- **One-to-Many** with `Rating`: A user can have multiple ratings
- **One-to-Many** with `WatchlistItem`: A user can have multiple watchlist items

#### Database Queries

**Create User:**
```typescript
await prisma.user.create({
  data: {
    username: "john_doe",
    email: "john@example.com",
    password: hashedPassword,
  },
});
```

**Find User by Email:**
```typescript
await prisma.user.findUnique({
  where: { email: "john@example.com" },
});
```

**Find User by Username:**
```typescript
await prisma.user.findUnique({
  where: { username: "john_doe" },
});
```

**Find User by ID:**
```typescript
await prisma.user.findUnique({
  where: { id: userId },
});
```

**Get All Users:**
```typescript
await prisma.user.findMany();
```

#### Indexes
- `id` (Primary Key)
- `username` (Unique Index)
- `email` (Unique Index)

---

### 2. Movie Model

#### Purpose
Stores movie information including metadata, ratings, and external IDs.

#### Schema Definition
```prisma
model Movie {
  id          String   @id @default(cuid())
  title       String
  genre       String   // Stored as comma-separated string
  year        Int
  description String
  director    String?
  actors      String?  // Stored as comma-separated string
  rating      Float?
  imageUrl    String?
  runtime     Int?     // in minutes
  language    String?
  country     String?
  imdbId      String?  @unique
  tmdbId      Int?     @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  ratings     Rating[]
  watchlist   WatchlistItem[]

  @@map("movies")
}
```

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key, CUID | Unique identifier for the movie |
| `title` | String | Required | Movie title |
| `genre` | String | Required | Comma-separated genres (e.g., "action,thriller") |
| `year` | Int | Required | Release year |
| `description` | String | Required | Movie plot/description |
| `director` | String? | Optional | Director name |
| `actors` | String? | Optional | Comma-separated actor names |
| `rating` | Float? | Optional | Average rating (0-10 scale) |
| `imageUrl` | String? | Optional | Poster/image URL |
| `runtime` | Int? | Optional | Runtime in minutes |
| `language` | String? | Optional | Primary language |
| `country` | String? | Optional | Production country |
| `imdbId` | String? | Unique, Optional | IMDb identifier |
| `tmdbId` | Int? | Unique, Optional | The Movie Database ID |
| `createdAt` | DateTime | Auto-generated | Timestamp when movie was added |
| `updatedAt` | DateTime | Auto-updated | Timestamp when movie was last updated |

#### Relations
- **One-to-Many** with `Rating`: A movie can have multiple ratings
- **One-to-Many** with `WatchlistItem`: A movie can be in multiple watchlists

#### Database Queries

**Create Movie:**
```typescript
await prisma.movie.create({
  data: {
    title: "The Matrix",
    genre: "action,sci-fi",
    year: 1999,
    description: "A computer hacker learns about the true nature of reality...",
    director: "Lana Wachowski",
    actors: "Keanu Reeves,Laurence Fishburne",
    rating: 8.7,
    imageUrl: "https://example.com/poster.jpg",
    runtime: 136,
    language: "English",
    country: "USA",
    tmdbId: 603,
  },
});
```

**Get All Movies (Paginated):**
```typescript
await prisma.movie.findMany({
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});
```

**Get Movie by ID:**
```typescript
await prisma.movie.findUnique({
  where: { id: movieId },
});
```

**Search Movies:**
```typescript
await prisma.movie.findMany({
  where: {
    OR: [
      { title: { contains: query } },
      { description: { contains: query } },
      { director: { contains: query } },
    ],
    genre: { contains: genre },
    year: year,
    rating: {
      gte: minRating,
      lte: maxRating,
    },
  },
  orderBy: { rating: 'desc' },
});
```

**Update Movie:**
```typescript
await prisma.movie.update({
  where: { id: movieId },
  data: {
    rating: 9.0,
    description: "Updated description",
  },
});
```

**Delete Movie:**
```typescript
await prisma.movie.delete({
  where: { id: movieId },
});
```

**Find Movie by TMDB ID:**
```typescript
await prisma.movie.findUnique({
  where: { tmdbId: 603 },
});
```

**Find Movie by IMDb ID:**
```typescript
await prisma.movie.findUnique({
  where: { imdbId: "tt0133093" },
});
```

#### Indexes
- `id` (Primary Key)
- `tmdbId` (Unique Index)
- `imdbId` (Unique Index)
- Consider adding indexes on: `title`, `year`, `genre` for better search performance

#### Data Conversion

**Application Layer (TypeScript):**
- `genre`: Array of strings `["action", "sci-fi"]`
- `actors`: Array of strings `["Keanu Reeves", "Laurence Fishburne"]`

**Database Layer (PostgreSQL):**
- `genre`: Comma-separated string `"action,sci-fi"`
- `actors`: Comma-separated string `"Keanu Reeves,Laurence Fishburne"`

**Conversion Methods:**
```typescript
// Convert to array
genre: dbMovie.genre.split(',').map(g => g.trim())

// Convert to string
genre: movieData.genre.join(',')
```

---

### 3. Rating Model

#### Purpose
Stores user ratings and reviews for movies.

#### Schema Definition
```prisma
model Rating {
  id        String   @id @default(cuid())
  rating    Int      // 1-5 stars
  liked     Boolean
  review    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Foreign keys
  userId    String
  movieId   String

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie     Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)

  // Composite unique constraint - one rating per user per movie
  @@unique([userId, movieId])
  @@map("ratings")
}
```

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key, CUID | Unique identifier for the rating |
| `rating` | Int | Required, 1-5 | Star rating (1-5 scale) |
| `liked` | Boolean | Required | Whether user liked the movie |
| `review` | String? | Optional | User's text review (max 500 chars) |
| `userId` | String | Foreign Key, Required | Reference to User |
| `movieId` | String | Foreign Key, Required | Reference to Movie |
| `createdAt` | DateTime | Auto-generated | Timestamp when rating was created |
| `updatedAt` | DateTime | Auto-updated | Timestamp when rating was last updated |

#### Relations
- **Many-to-One** with `User`: Each rating belongs to one user
- **Many-to-One** with `Movie`: Each rating belongs to one movie
- **Cascade Delete**: Deleting a user or movie deletes associated ratings

#### Constraints
- **Unique Constraint**: `@@unique([userId, movieId])` - One rating per user per movie
- **Foreign Key Constraints**: Ensures referential integrity

#### Database Queries

**Create or Update Rating (Upsert):**
```typescript
await prisma.rating.upsert({
  where: {
    userId_movieId: {
      userId: userId,
      movieId: movieId,
    },
  },
  update: {
    rating: 5,
    liked: true,
    review: "Amazing movie!",
  },
  create: {
    userId: userId,
    movieId: movieId,
    rating: 5,
    liked: true,
    review: "Amazing movie!",
  },
});
```

**Get User Ratings:**
```typescript
await prisma.rating.findMany({
  where: { userId: userId },
  orderBy: { createdAt: 'desc' },
});
```

**Get Movie Ratings:**
```typescript
await prisma.rating.findMany({
  where: { movieId: movieId },
  orderBy: { createdAt: 'desc' },
});
```

**Get All Ratings:**
```typescript
await prisma.rating.findMany();
```

**Get Rating with User and Movie:**
```typescript
await prisma.rating.findMany({
  include: {
    user: true,
    movie: true,
  },
});
```

**Calculate Average Rating:**
```typescript
const ratings = await prisma.rating.findMany({
  where: { movieId: movieId },
});
const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
```

**Get Liked Movies:**
```typescript
await prisma.rating.findMany({
  where: {
    userId: userId,
    liked: true,
    rating: { gte: 4 },
  },
});
```

#### Indexes
- `id` (Primary Key)
- `userId` (Foreign Key Index)
- `movieId` (Foreign Key Index)
- `userId_movieId` (Composite Unique Index)

---

### 4. WatchlistItem Model

#### Purpose
Stores movies that users want to watch later.

#### Schema Definition
```prisma
model WatchlistItem {
  id       String   @id @default(cuid())
  priority String   @default("medium") // "low", "medium", "high"
  notes    String?
  addedAt  DateTime @default(now())

  // Foreign keys
  userId   String
  movieId  String

  // Relations
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie    Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)

  // Composite unique constraint - one watchlist item per user per movie
  @@unique([userId, movieId])
  @@map("watchlist_items")
}
```

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key, CUID | Unique identifier for the watchlist item |
| `priority` | String | Default: "medium" | Priority level: "low", "medium", or "high" |
| `notes` | String? | Optional | User notes about the movie |
| `addedAt` | DateTime | Auto-generated | Timestamp when movie was added to watchlist |
| `userId` | String | Foreign Key, Required | Reference to User |
| `movieId` | String | Foreign Key, Required | Reference to Movie |

#### Relations
- **Many-to-One** with `User`: Each watchlist item belongs to one user
- **Many-to-One** with `Movie`: Each watchlist item references one movie
- **Cascade Delete**: Deleting a user or movie deletes associated watchlist items

#### Constraints
- **Unique Constraint**: `@@unique([userId, movieId])` - One watchlist item per user per movie
- **Priority Constraint**: Should be one of: "low", "medium", "high" (enforced in application layer)

#### Database Queries

**Add to Watchlist (Upsert):**
```typescript
await prisma.watchlistItem.upsert({
  where: {
    userId_movieId: {
      userId: userId,
      movieId: movieId,
    },
  },
  update: {
    priority: "high",
    notes: "Must watch this weekend",
  },
  create: {
    userId: userId,
    movieId: movieId,
    priority: "high",
    notes: "Must watch this weekend",
  },
});
```

**Get User Watchlist:**
```typescript
await prisma.watchlistItem.findMany({
  where: { userId: userId },
  orderBy: { addedAt: 'desc' },
});
```

**Get Watchlist by Priority:**
```typescript
await prisma.watchlistItem.findMany({
  where: {
    userId: userId,
    priority: "high",
  },
  orderBy: { addedAt: 'desc' },
});
```

**Remove from Watchlist:**
```typescript
await prisma.watchlistItem.delete({
  where: {
    userId_movieId: {
      userId: userId,
      movieId: movieId,
    },
  },
});
```

**Get Watchlist with Movie Details:**
```typescript
await prisma.watchlistItem.findMany({
  where: { userId: userId },
  include: {
    movie: true,
  },
  orderBy: { addedAt: 'desc' },
});
```

#### Indexes
- `id` (Primary Key)
- `userId` (Foreign Key Index)
- `movieId` (Foreign Key Index)
- `userId_movieId` (Composite Unique Index)
- Consider adding index on `priority` for filtering

---

## Database Service Layer

### Database Service (`src/services/database.ts`)

The application uses a singleton `DatabaseService` class that wraps Prisma Client and provides type-safe database operations.

#### Key Methods

**User Operations:**
- `createUser()`: Create new user
- `getUserById()`: Get user by ID
- `getUserByEmail()`: Get user by email
- `getUserByUsername()`: Get user by username

**Movie Operations:**
- `getMovies()`: Get paginated list of movies
- `getMovieById()`: Get movie by ID
- `createMovie()`: Create new movie
- `updateMovie()`: Update movie
- `deleteMovie()`: Delete movie
- `searchMovies()`: Search movies with filters

**Rating Operations:**
- `createOrUpdateRating()`: Upsert rating
- `getUserRatings()`: Get all ratings by user
- `getMovieRatings()`: Get all ratings for movie
- `getAllRatings()`: Get all ratings

**Watchlist Operations:**
- `addToWatchlist()`: Add/update watchlist item
- `removeFromWatchlist()`: Remove watchlist item
- `getUserWatchlist()`: Get user's watchlist

#### Data Conversion

The service includes conversion methods to transform Prisma models to application types:
- `convertDbUserToUser()`: Converts Prisma User to application User
- `convertDbMovieToMovie()`: Converts Prisma Movie to application Movie (handles genre/actors arrays)
- `convertDbRatingToRating()`: Converts Prisma Rating to application Rating
- `convertDbWatchlistItemToWatchlistItem()`: Converts Prisma WatchlistItem to application WatchlistItem

## Migrations

### Creating Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Files

Migrations are stored in `prisma/migrations/` directory. Each migration includes:
- SQL schema changes
- Up migration (apply changes)
- Down migration (rollback changes)

## Database Queries Summary

### Common Query Patterns

**Pagination:**
```typescript
const { movies, total } = await db.getMovies(page, limit);
```

**Filtering:**
```typescript
const movies = await db.searchMovies({
  genre: "action",
  year: 2020,
  minRating: 7.0,
});
```

**Relations:**
```typescript
const ratings = await prisma.rating.findMany({
  include: {
    user: true,
    movie: true,
  },
});
```

**Aggregations:**
```typescript
const averageRating = await prisma.rating.aggregate({
  where: { movieId },
  _avg: { rating: true },
});
```

## Performance Considerations

### Indexes

Current indexes:
- Primary keys (automatic)
- Unique constraints (automatic)
- Foreign keys (automatic)

**Recommended Additional Indexes:**
```prisma
// For movie search
@@index([title])
@@index([year])
@@index([rating])

// For rating queries
@@index([userId, createdAt])
@@index([movieId, createdAt])
```

### Query Optimization

1. **Use select to limit fields:**
   ```typescript
   await prisma.movie.findMany({
     select: { id: true, title: true, year: true },
   });
   ```

2. **Use pagination for large datasets:**
   ```typescript
   await prisma.movie.findMany({
     skip: (page - 1) * limit,
     take: limit,
   });
   ```

3. **Batch operations:**
   ```typescript
   await prisma.$transaction([
     prisma.movie.create({ data: movie1 }),
     prisma.movie.create({ data: movie2 }),
   ]);
   ```

## Summary

The database schema provides:
- **User Management**: Authentication and user profiles
- **Movie Catalog**: Comprehensive movie information
- **Rating System**: User ratings and reviews
- **Watchlist**: Personal movie lists
- **Relations**: Proper foreign key relationships
- **Constraints**: Data integrity through unique constraints
- **Type Safety**: Prisma-generated types for TypeScript

