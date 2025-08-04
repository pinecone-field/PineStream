import Database from "better-sqlite3";
import { defineEventHandler } from "h3";

const db = new Database("movies.db");

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    switch (method) {
      case "GET":
        // Get all watched movies
        const watchedStmt = db.prepare(`
          SELECT m.*, wm.watched_at 
          FROM user_watched_movies wm
          JOIN movies m ON wm.movie_id = m.id
          ORDER BY wm.watched_at DESC
        `);
        const watchedMovies = watchedStmt.all() as any[];

        return {
          watchedMovies: watchedMovies.map((movie) => ({
            id: movie.id,
            title: movie.title,
            poster_url: movie.poster_url,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            genre: movie.genre,
            watched_at: movie.watched_at,
          })),
        };

      case "POST":
        // Add movie to watched list
        const body = await readBody(event);
        const { movieId } = body;

        if (!movieId) {
          throw createError({
            statusCode: 400,
            statusMessage: "Movie ID is required",
          });
        }

        // Check if movie exists
        const movieStmt = db.prepare("SELECT id FROM movies WHERE id = ?");
        const movie = movieStmt.get(movieId);

        if (!movie) {
          throw createError({
            statusCode: 404,
            statusMessage: "Movie not found",
          });
        }

        // Check if already watched
        const existingStmt = db.prepare(
          "SELECT id FROM user_watched_movies WHERE movie_id = ?"
        );
        const existing = existingStmt.get(movieId);

        if (existing) {
          return { message: "Movie already in watched list" };
        }

        // Add to watched list
        const insertStmt = db.prepare(
          "INSERT INTO user_watched_movies (movie_id) VALUES (?)"
        );
        insertStmt.run(movieId);

        return { message: "Movie added to watched list" };

      case "DELETE":
        // Remove movie from watched list
        const deleteBody = await readBody(event);
        const { movieId: deleteMovieId } = deleteBody;

        if (!deleteMovieId) {
          throw createError({
            statusCode: 400,
            statusMessage: "Movie ID is required",
          });
        }

        const deleteStmt = db.prepare(
          "DELETE FROM user_watched_movies WHERE movie_id = ?"
        );
        const result = deleteStmt.run(deleteMovieId);

        if (result.changes === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: "Movie not found in watched list",
          });
        }

        return { message: "Movie removed from watched list" };

      default:
        throw createError({
          statusCode: 405,
          statusMessage: "Method not allowed",
        });
    }
  } catch (error) {
    console.error("Error managing watched movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
