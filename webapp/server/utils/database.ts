import Database from "better-sqlite3";

// Get database file from environment variable, default to movies.db
export function getDatabasePath(): string {
  return process.env.DATABASE_FILE || "movies.db";
}

// Create a database instance with the configured database file
export function getDatabase(): Database.Database {
  const dbPath = getDatabasePath();
  return new Database(dbPath);
}

// Utility function to add watched status to movie data
export function addWatchedStatusToMovies(movies: any[], db: Database.Database): any[] {
  if (!movies || movies.length === 0) return movies;
  
  // Get all watched movie IDs for the current user
  const watchedStmt = db.prepare("SELECT movie_id FROM user_watched_movies");
  const watchedMovies = watchedStmt.all() as { movie_id: number }[];
  const watchedMovieIds = new Set(watchedMovies.map(w => w.movie_id));
  
  // Add watched status to each movie
  return movies.map(movie => ({
    ...movie,
    isWatched: watchedMovieIds.has(movie.id)
  }));
}

// Utility function to add watched status to a single movie
export function addWatchedStatusToMovie(movie: any, db: Database.Database): any {
  if (!movie) return movie;
  
  const watchedStmt = db.prepare("SELECT movie_id FROM user_watched_movies WHERE movie_id = ?");
  const watched = watchedStmt.get(movie.id);
  
  return {
    ...movie,
    isWatched: !!watched
  };
}
