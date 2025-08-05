import Database from "better-sqlite3";
import { defineEventHandler } from "h3";

const db = new Database("movies.db");

export default defineEventHandler(async (event) => {
  try {
    // Get user's watched movies
    const watchedStmt = db.prepare(`
      SELECT m.*, wm.watched_at 
      FROM user_watched_movies wm
      JOIN movies m ON wm.movie_id = m.id
      ORDER BY wm.watched_at DESC
    `);
    const watchedMovies = watchedStmt.all() as any[];

    // PLACEHOLDER: Return empty results until students implement recommendations
    const recommendations: any[] = [];
    // END PLACEHOLDER

    return {
      recommendations: recommendations.map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre: movie.genre,
        overview: movie.overview,
      })),
      watchedCount: watchedMovies.length,
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
