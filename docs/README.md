# Movie Recommendation API - Documentation

This directory contains comprehensive documentation for the Movie Recommendation API system.

## Documentation Index

### 📦 [Docker Documentation](./DOCKER.md)
Complete guide to Docker containerization:
- Dockerfile analysis and optimization
- Build process and layer caching
- Container configuration and environment variables
- Security best practices
- Troubleshooting guide

### ☸️ [Kubernetes Documentation](./KUBERNETES.md)
Detailed Kubernetes deployment guide:
- Architecture overview
- Deployment, Service, and Ingress configurations
- CI/CD pipeline integration
- Secrets management
- Scaling and health checks
- Troubleshooting common issues

### 🗄️ [Database Models Documentation](./DATABASE_MODELS.md)
Comprehensive database schema documentation:
- Prisma schema models (User, Movie, Rating, WatchlistItem)
- Field descriptions and constraints
- Database queries and operations
- Relationships and foreign keys
- Performance optimization tips

### 🔌 [API Endpoints Documentation](./API_ENDPOINTS.md)
Complete API reference:
- All endpoints with request/response examples
- Authentication and authorization
- Rate limiting information
- Error codes and handling
- Query parameters and filtering

### 📊 [Monitoring & Observability Documentation](./MONITORING.md)
Comprehensive monitoring guide:
- Prometheus metrics collection
- Grafana dashboards and visualization
- Alerting rules and configuration
- Query examples and best practices
- Troubleshooting guide

## Quick Start

### Architecture Overview

```
┌─────────────────┐
│   Internet      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ingress (NGINX)│  ← SSL/TLS Termination
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service (K8s)  │  ← Load Balancing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deployment     │  ← 2 Replicas
│  ┌───────────┐ │
│  │   Pod 1    │ │
│  └───────────┘ │
│  ┌───────────┐ │
│  │   Pod 2    │ │
│  └───────────┘ │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  ← Database
└─────────────────┘
```

### Technology Stack

- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Containerization**: Docker
- **Orchestration**: Kubernetes (DigitalOcean)
- **External APIs**: TMDB, OpenAI

### Key Features

1. **User Management**
   - Registration and authentication
   - JWT-based session management
   - User profiles

2. **Movie Catalog**
   - CRUD operations
   - Advanced search and filtering
   - TMDB integration for movie data

3. **Recommendation Engine**
   - Collaborative filtering
   - Content-based filtering
   - AI-powered recommendations (OpenAI)
   - Hybrid approach

4. **Rating System**
   - User ratings (1-5 stars)
   - Reviews and comments
   - Average rating calculations

5. **Watchlist**
   - Personal movie lists
   - Priority levels
   - Notes and reminders

6. **Data Enrichment**
   - Automatic TMDB metadata updates
   - Missing data analysis
   - Similar movies discovery

## Deployment Flow

1. **Code Push** → GitHub repository
2. **CI/CD Trigger** → GitHub Actions workflow
3. **Build** → Docker image creation
4. **Push** → DigitalOcean Container Registry
5. **Deploy** → Kubernetes cluster
6. **Update** → Rolling deployment (zero downtime)

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-secret-key

# External APIs
OPENAI_API_KEY=your-openai-key
TMDB_API_KEY=your-tmdb-key
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500

# Application
PORT=8080
```

## API Base URLs

- **Production**: `https://api.teja.live`
- **Local**: `http://localhost:3000`

## Database Schema

### Models
- **User**: User accounts and authentication
- **Movie**: Movie catalog with metadata
- **Rating**: User ratings and reviews
- **WatchlistItem**: Personal watchlists

### Relationships
- User → Ratings (One-to-Many)
- User → WatchlistItems (One-to-Many)
- Movie → Ratings (One-to-Many)
- Movie → WatchlistItems (One-to-Many)

## Common Tasks

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Docker

```bash
# Build image
docker build -t movie-api .

# Run container
docker run -p 3000:8080 --env-file .env movie-api
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=node-app

# View logs
kubectl logs -l app=node-app

# Scale deployment
kubectl scale deployment node-app --replicas=5
```

## Monitoring

### Health Check
```bash
curl https://api.teja.live/health
```

### Pod Status
```bash
kubectl get pods -l app=node-app
kubectl describe pod <pod-name>
```

### Logs
```bash
kubectl logs -l app=node-app --tail=100
kubectl logs -f <pod-name>
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Verify database is accessible
   - Check network policies

2. **Image Pull Errors**
   - Verify image pull secrets
   - Check registry authentication
   - Ensure image exists in registry

3. **Certificate Issues**
   - Check cert-manager status
   - Verify ClusterIssuer configuration
   - Check DNS configuration

4. **Rate Limiting**
   - Check rate limit headers
   - Wait for rate limit window to reset
   - Use authentication for higher limits

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [DigitalOcean Kubernetes](https://docs.digitalocean.com/products/kubernetes/)
- [Express.js Documentation](https://expressjs.com/)
- [TMDB API Documentation](https://developers.themoviedb.org/)

## Support

For issues or questions:
1. Check the relevant documentation file
2. Review error logs
3. Check GitHub Issues
4. Contact the development team

---

**Last Updated**: January 2024

