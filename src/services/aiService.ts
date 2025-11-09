import OpenAI from 'openai';
import { Movie, Rating, Recommendation } from '../types';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export class AIService {
  static async generateRecommendations(
    userRatings: Rating[],
    allMovies: Movie[],
    likedMovies: Movie[]
  ): Promise<Recommendation[]> {
    try {
      if (likedMovies.length === 0) {
        return this.getPopularMovies(allMovies);
      }

      if (!openai) {
        console.warn('OpenAI API key not configured, using fallback recommendations');
        return this.getFallbackRecommendations(likedMovies, allMovies);
      }

      const prompt = this.buildRecommendationPrompt(likedMovies, allMovies);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a movie recommendation expert. Analyze user preferences and recommend movies from the provided list. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const recommendations = this.parseAIResponse(response, allMovies);
      return recommendations.slice(0, 10); // Limit to top 10
    } catch (error) {
      console.error('AI recommendation error:', error);
      return this.getFallbackRecommendations(likedMovies, allMovies);
    }
  }

  private static buildRecommendationPrompt(likedMovies: Movie[], allMovies: Movie[]): string {
    const likedGenres = this.extractGenres(likedMovies);
    const likedYears = likedMovies.map(m => m.year);
    const avgYear = Math.round(likedYears.reduce((a, b) => a + b, 0) / likedYears.length);

    return `
Based on these liked movies:
${likedMovies.map(m => `- ${m.title} (${m.year}) - Genres: ${m.genre.join(', ')}`).join('\n')}

User seems to prefer:
- Genres: ${likedGenres.join(', ')}
- Average year preference: ${avgYear}

Please recommend 10 movies from this available list:
${allMovies.map(m => `${m.id}: ${m.title} (${m.year}) - ${m.genre.join(', ')}`).join('\n')}

Return recommendations as JSON array with this format:
[
  {
    "movieId": "movie_id_here",
    "score": 0.95,
    "reason": "Brief reason for recommendation"
  }
]

Focus on genre similarity, year proximity, and thematic connections. Score should be 0.1-1.0.
    `;
  }

  private static parseAIResponse(response: string, allMovies: Movie[]): Recommendation[] {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const aiRecommendations = JSON.parse(cleanResponse);

      return aiRecommendations
        .map((rec: any) => {
          const movie = allMovies.find(m => m.id === rec.movieId);
          if (!movie) return null;

          return {
            movie,
            score: Math.max(0.1, Math.min(1.0, rec.score || 0.5)),
            reason: rec.reason || 'AI recommended based on your preferences',
          };
        })
        .filter(Boolean)
        .sort((a: Recommendation, b: Recommendation) => b.score - a.score);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private static getFallbackRecommendations(likedMovies: Movie[], allMovies: Movie[]): Recommendation[] {
    const likedGenres = this.extractGenres(likedMovies);
    const avgYear = likedMovies.length > 0 
      ? Math.round(likedMovies.map(m => m.year).reduce((a, b) => a + b, 0) / likedMovies.length)
      : 2000;

    return allMovies
      .filter(movie => !likedMovies.some(liked => liked.id === movie.id))
      .map(movie => {
        let score = 0.1;
        let reasons = [];

        // Genre similarity
        const genreMatch = movie.genre.some(g => likedGenres.includes(g));
        if (genreMatch) {
          score += 0.4;
          reasons.push('similar genres');
        }

        // Year proximity
        const yearDiff = Math.abs(movie.year - avgYear);
        if (yearDiff <= 5) {
          score += 0.3;
          reasons.push('similar time period');
        } else if (yearDiff <= 15) {
          score += 0.2;
        }

        // Rating boost for newer movies
        if (movie.year > 2010) {
          score += 0.1;
        }

        return {
          movie,
          score: Math.min(score, 1.0),
          reason: reasons.length > 0 
            ? `Recommended due to ${reasons.join(' and ')}`
            : 'Popular choice',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private static getPopularMovies(allMovies: Movie[]): Recommendation[] {
    return allMovies
      .sort((a, b) => b.year - a.year) // Sort by newest first
      .slice(0, 10)
      .map((movie, index) => ({
        movie,
        score: 0.8 - (index * 0.05), // Decreasing score
        reason: 'Popular recent movie',
      }));
  }

  private static extractGenres(movies: Movie[]): string[] {
    const genreCount: { [key: string]: number } = {};
    
    movies.forEach(movie => {
      movie.genre.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    return Object.keys(genreCount)
      .sort((a, b) => genreCount[b] - genreCount[a])
      .slice(0, 5); // Top 5 preferred genres
  }
}