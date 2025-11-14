# Build stage
FROM node:18

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build


# Expose port (app defaults to 3000, but can be overridden via PORT env var)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]