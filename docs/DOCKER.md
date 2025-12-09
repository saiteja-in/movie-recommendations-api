# Docker Documentation

## Overview

This application uses Docker to containerize the Node.js/TypeScript movie recommendation API. The Docker setup enables consistent deployment across different environments and simplifies the CI/CD pipeline.

## Dockerfile Analysis

### Base Image
```dockerfile
FROM node:18
```
- Uses Node.js version 18 as the base image
- Provides a complete Node.js runtime environment
- Includes npm package manager

### Working Directory
```dockerfile
WORKDIR /usr/src/app
```
- Sets `/usr/src/app` as the working directory inside the container
- All subsequent commands run from this directory

### Dependency Installation
```dockerfile
COPY package*.json ./
RUN npm ci
```
- Copies `package.json` and `package-lock.json` first (for better layer caching)
- Uses `npm ci` instead of `npm install` for:
  - Faster, reliable, reproducible builds
  - Installs exactly what's in `package-lock.json`
  - Automatically removes `node_modules` if it exists
  - Fails if `package-lock.json` is out of sync

### Prisma Setup
```dockerfile
COPY prisma ./prisma
RUN npx prisma generate
```
- Copies Prisma schema files
- Generates Prisma Client before building TypeScript
- Ensures database client is available during build

### Source Code and Build
```dockerfile
COPY . .
RUN npm run build
```
- Copies all source code into the container
- Runs TypeScript compilation (`tsc`)
- Outputs compiled JavaScript to `dist/` directory

### Port Exposure
```dockerfile
EXPOSE 8080
```
- Documents that the container listens on port 8080
- Note: The app defaults to port 3000, but Kubernetes deployment overrides this via `PORT` environment variable

### Startup Command
```dockerfile
CMD ["npm", "start"]
```
- Runs `npm start` which executes `node dist/app.js`
- Starts the compiled application

## Build Process

### Building the Docker Image
```bash
docker build -t movie-recommendation-api:latest .
```

### Build Context
- The build context includes all files in the project directory
- `.dockerignore` should be used to exclude unnecessary files (node_modules, .git, etc.)

### Layer Caching Strategy
The Dockerfile is optimized for layer caching:
1. **Layer 1**: Base image (Node.js 18) - rarely changes
2. **Layer 2**: Package files and dependencies - changes when dependencies update
3. **Layer 3**: Prisma schema and generation - changes when schema updates
4. **Layer 4**: Source code and build - changes frequently

This ordering ensures that dependency installation (slow step) is cached unless dependencies change.

## Container Configuration

### Environment Variables
The container expects these environment variables (provided via Kubernetes secrets):

- `PORT`: Application port (default: 3000, overridden to 8080 in K8s)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `OPENAI_API_KEY`: OpenAI API key for AI recommendations
- `TMDB_API_KEY`: The Movie Database API key
- `TMDB_BASE_URL`: TMDB API base URL
- `TMDB_IMAGE_BASE_URL`: TMDB image CDN base URL

### Runtime Behavior
- The application connects to PostgreSQL database on startup
- Prisma Client is pre-generated, so no runtime generation needed
- Application runs in production mode (no dev dependencies)

## Multi-Stage Build (Potential Optimization)

While the current Dockerfile uses a single-stage build, a multi-stage build could optimize image size:

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 8080
CMD ["npm", "start"]
```

**Benefits:**
- Smaller final image (alpine base)
- Only production dependencies in final image
- Dev dependencies excluded from production

## Docker Compose (Local Development)

For local development, you might use Docker Compose:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:8080"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/moviedb
      - JWT_SECRET=your-secret-key
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=moviedb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Image Registry

### DigitalOcean Container Registry
The application uses DigitalOcean Container Registry:
- Registry URL: `registry.digitalocean.com/movierec/node-app`
- Images are tagged with Git commit SHA: `${GITHUB_SHA::8}`
- Latest tag also maintained for convenience

### Image Tagging Strategy
- **Commit SHA**: `registry.digitalocean.com/movierec/node-app:abc12345`
  - Immutable, traceable to specific commit
  - Used in production deployments
- **Latest**: `registry.digitalocean.com/movierec/node-app:latest`
  - Points to most recent build
  - Convenient but mutable

## Security Considerations

### Best Practices
1. **Base Image**: Use official Node.js images from Docker Hub
2. **Non-root User**: Consider running as non-root user in production
3. **Secrets**: Never hardcode secrets in Dockerfile
4. **Layer Scanning**: Regularly scan images for vulnerabilities
5. **Minimal Base**: Consider alpine variants for smaller attack surface

### Example Security Improvements
```dockerfile
# Add non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# Or use node's built-in user
USER node
```

## Troubleshooting

### Common Issues

1. **Build Fails - Prisma Generate**
   - Ensure Prisma schema is valid
   - Check that `prisma/schema.prisma` exists

2. **Runtime Errors - Database Connection**
   - Verify `DATABASE_URL` environment variable
   - Check database is accessible from container network

3. **Port Conflicts**
   - Ensure port 8080 is not used by host
   - Check Kubernetes service configuration

4. **Large Image Size**
   - Use `.dockerignore` to exclude unnecessary files
   - Consider multi-stage builds
   - Remove dev dependencies in production

### Debugging Commands
```bash
# Build with verbose output
docker build --progress=plain -t movie-api .

# Run container interactively
docker run -it --env-file .env movie-api sh

# Inspect image layers
docker history movie-api

# Check image size
docker images movie-api
```

## CI/CD Integration

The Docker image is built and pushed in GitHub Actions workflow:

1. **Build**: Creates image with commit SHA tag
2. **Push**: Uploads to DigitalOcean Container Registry
3. **Deploy**: Kubernetes pulls image from registry

### Authentication
- Uses `doctl` CLI for registry authentication
- Token stored in GitHub Secrets (`DIGITALOCEAN_ACCESS_TOKEN`)
- Registry login expires after 600 seconds (10 minutes)

## Performance Optimization

### Build Time Optimization
- Layer caching reduces rebuild time
- Parallel builds possible with Docker BuildKit
- Use `--cache-from` for multi-stage builds

### Runtime Optimization
- Pre-generate Prisma Client (done in build)
- Compile TypeScript during build (not runtime)
- Use production npm install (`npm ci --only=production`)

### Image Size Optimization
- Use `.dockerignore` to exclude:
  - `node_modules/`
  - `.git/`
  - `*.md` (except README)
  - `tests/`
  - `.env*` files
  - IDE files

## Monitoring and Logging

### Container Logs
```bash
# View container logs
docker logs <container-id>

# Follow logs
docker logs -f <container-id>

# Last 100 lines
docker logs --tail 100 <container-id>
```

### Health Checks
The application includes a `/health` endpoint that can be used for Docker health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

## Summary

The Docker setup provides:
- **Consistency**: Same environment across dev/staging/prod
- **Isolation**: Application dependencies contained
- **Portability**: Run anywhere Docker is available
- **Scalability**: Easy to scale horizontally in Kubernetes
- **CI/CD Integration**: Automated builds and deployments

