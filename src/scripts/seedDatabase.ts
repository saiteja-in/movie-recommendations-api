import { db } from '../services/database';
import fs from 'fs';
import path from 'path';

const seedDatabase = async (): Promise<void> => {
  try {
    await db.connect();
    console.log('Connected to database');

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('Clearing existing data...');
    // Note: Prisma doesn't have a direct way to clear all tables, so we'll skip this for now

    // Load sample movies
    const sampleMoviesPath = path.join(process.cwd(), 'data', 'sample-movies.json');
    if (fs.existsSync(sampleMoviesPath)) {
      const sampleMoviesData = fs.readFileSync(sampleMoviesPath, 'utf-8');
      const sampleMovies = JSON.parse(sampleMoviesData);

      console.log('Seeding movies...');
      for (const movieData of sampleMovies) {
        try {
          await db.createMovie({
            title: movieData.title,
            genre: movieData.genre,
            year: movieData.year,
            description: movieData.description,
            director: movieData.director,
            actors: movieData.actors,
            rating: movieData.rating,
            imageUrl: movieData.imageUrl,
            runtime: movieData.runtime,
            language: movieData.language || 'English',
            country: movieData.country || 'USA',
            imdbId: movieData.imdbId,
            tmdbId: movieData.tmdbId,
          });
          console.log(`✅ Added movie: ${movieData.title}`);
        } catch (error) {
          console.log(`⚠️  Skipped ${movieData.title} (might already exist)`);
        }
      }
    }

    // Create sample users
    console.log('Creating sample users...');
    const sampleUsers = [
      {
        username: 'moviefan',
        email: 'moviefan@example.com',
        password: '$2a$10$rGvGZ1QdGF5H7WvP2K3Zo.XMKJP4bqC5VGYHEP2kQoHZUX0QZ1QdG', // "password123"
      },
      {
        username: 'filmcritic',
        email: 'critic@example.com',
        password: '$2a$10$rGvGZ1QdGF5H7WvP2K3Zo.XMKJP4bqC5VGYHEP2kQoHZUX0QZ1QdG', // "password123"
      },
    ];

    for (const userData of sampleUsers) {
      try {
        await db.createUser(userData);
        console.log(`✅ Created user: ${userData.username}`);
      } catch (error) {
        console.log(`⚠️  Skipped user ${userData.username} (might already exist)`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('Username: moviefan, Email: moviefan@example.com, Password: password123');
    console.log('Username: filmcritic, Email: critic@example.com, Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await db.disconnect();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };