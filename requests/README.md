# REST Client Test Files 🧪

This folder contains VS Code REST Client files to test all API endpoints.

## Setup

1. Install the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) in VS Code
2. Make sure your server is running: `npm run dev`
3. Open any `.http` file and click "Send Request" above each request

## Test Files

### 1. `complete-workflow.http` ⭐ **START HERE**
Complete end-to-end workflow that demonstrates the full recommendation system:
- Register user → Rate movies → Get AI recommendations

### 2. `auth.http` 
Authentication endpoints:
- User registration
- User login
- Get profile

### 3. `movies.http`
Movie management:
- Get all movies
- Search movies
- Add new movies

### 4. `ratings.http`
Rating system:
- Rate movies
- Get user ratings
- Get movie ratings

### 5. `recommendations.http`
Recommendation system:
- AI-powered recommendations
- Genre-based recommendations

## Usage Tips

1. **Start with `complete-workflow.http`** - it shows the full user journey
2. **Token Management**: After login/register, copy the token and replace `@token = your-jwt-token-here` in other files
3. **Auto Token**: In `complete-workflow.http`, the token is automatically extracted using REST Client variables
4. **Sequential Testing**: Run requests in order, especially in the workflow file

## Example Flow

1. Open `complete-workflow.http`
2. Run Step 1 (Health Check)
3. Run Step 2 (Register User) - token will be auto-extracted
4. Continue through all steps to see AI recommendations in action

## Common Status Codes

- `200` - Success
- `201` - Created successfully  
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found
- `409` - Conflict (user already exists)