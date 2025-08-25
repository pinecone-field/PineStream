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

// Movie operations
export class MovieService {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Get movies with pagination and watched status
  getMoviesWithPagination(
    page: number,
    limit: number,
    orderBy: string = "popularity DESC, vote_average DESC"
  ) {
    const offset = (page - 1) * limit;

    // Get total count
    const countStmt = this.db.prepare("SELECT COUNT(*) as total FROM movies");
    const { total } = countStmt.get() as { total: number };

    // Get movies with pagination
    const moviesStmt = this.db.prepare(`
      SELECT * FROM movies 
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `);
    const movies = moviesStmt.all(limit, offset) as any[];

    const totalPages = Math.ceil(total / limit);

    // Add watched status
    const moviesWithWatchedStatus = this.addWatchedStatusToMovies(movies);

    return {
      movies: moviesWithWatchedStatus,
      total,
      totalPages,
    };
  }

  // Get random movies with watched status
  getRandomMovies(count: number) {
    const limitedCount = Math.max(1, Math.min(500, count));
    const stmt = this.db.prepare(`
      SELECT * FROM movies 
      ORDER BY RANDOM() 
      LIMIT ?
    `);
    const movies = stmt.all(limitedCount) as any[];

    return this.addWatchedStatusToMovies(movies);
  }

  // Get movie by ID with watched status
  getMovieById(id: number | string) {
    const stmt = this.db.prepare("SELECT * FROM movies WHERE id = ?");
    const movie = stmt.get(id) as any;

    if (!movie) return null;

    return this.addWatchedStatusToMovie(movie);
  }

  // Search movies with pagination and watched status
  searchMovies(searchTerm: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    // Search across title, overview, and genre
    const searchStmt = this.db.prepare(`
      SELECT * FROM movies 
      WHERE title LIKE ? OR overview LIKE ? OR genre LIKE ?
      ORDER BY popularity DESC, vote_average DESC 
      LIMIT ? OFFSET ?
    `);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total FROM movies 
      WHERE title LIKE ? OR overview LIKE ? OR genre LIKE ?
    `);

    const movies = searchStmt.all(
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
      offset
    ) as any[];

    const { total } = countStmt.get(
      searchPattern,
      searchPattern,
      searchPattern
    ) as { total: number };

    const totalPages = Math.ceil(total / limit);
    const moviesWithWatchedStatus = this.addWatchedStatusToMovies(movies);

    return {
      movies: moviesWithWatchedStatus,
      total,
      totalPages,
    };
  }

  // Get movies by IDs with optional watched status and limit
  getMoviesByIds(
    movieIds: number[],
    options?: {
      includeWatched?: boolean;
      limit?: number;
      orderBy?: string;
    }
  ) {
    if (movieIds.length === 0) return [];

    const placeholders = movieIds.map(() => "?").join(",");
    const includeWatched = options?.includeWatched ?? false;
    const limit = options?.limit;
    const orderBy = options?.orderBy ?? "vote_average DESC";

    let query = `SELECT * FROM movies WHERE id IN (${placeholders}) ORDER BY ${orderBy}`;

    if (limit) {
      query += ` LIMIT ?`;
      const stmt = this.db.prepare(query);
      const movies = stmt.all(...movieIds, limit) as any[];
      return includeWatched ? this.addWatchedStatusToMovies(movies) : movies;
    } else {
      const stmt = this.db.prepare(query);
      const movies = stmt.all(...movieIds) as any[];
      return includeWatched ? this.addWatchedStatusToMovies(movies) : movies;
    }
  }

  // Get random movie with plot for testing
  getRandomMovieWithPlot() {
    const stmt = this.db.prepare(`
      SELECT id, title, plot, overview 
      FROM movies 
      WHERE plot IS NOT NULL AND plot != '' 
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    return stmt.get();
  }

  // Get count of movies with plots
  getMoviesWithPlotsCount() {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM movies 
      WHERE plot IS NOT NULL AND plot != ''
    `);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get random movies with plots for testing
  getRandomMoviesWithPlots(limit: number) {
    const stmt = this.db.prepare(`
      SELECT id, title, plot, overview, genre, release_date 
      FROM movies 
      WHERE plot IS NOT NULL AND plot != '' 
      ORDER BY RANDOM() 
      LIMIT ?
    `);
    return stmt.all(limit) as any[];
  }

  // Get total movie count
  getMovieCount() {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM movies");
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Public methods for watched status (used by other services)
  addWatchedStatusToMovies(movies: any[]): any[] {
    if (!movies || movies.length === 0) return movies;

    // Get all watched movie IDs for the current user
    const watchedStmt = this.db.prepare(
      "SELECT movie_id FROM user_watched_movies"
    );
    const watchedMovies = watchedStmt.all() as { movie_id: number }[];
    const watchedMovieIds = new Set(watchedMovies.map((w) => w.movie_id));

    // Add watched status to each movie
    return movies.map((movie) => ({
      ...movie,
      isWatched: watchedMovieIds.has(movie.id),
    }));
  }

  addWatchedStatusToMovie(movie: any): any {
    if (!movie) return movie;

    const watchedStmt = this.db.prepare(
      "SELECT movie_id FROM user_watched_movies WHERE movie_id = ?"
    );
    const watched = watchedStmt.get(movie.id);

    return {
      ...movie,
      isWatched: !!watched,
    };
  }
}

// User operations
export class UserService {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Get watched movies
  getWatchedMovies() {
    const stmt = this.db.prepare(`
      SELECT m.*, wm.watched_at 
      FROM user_watched_movies wm
      JOIN movies m ON wm.movie_id = m.id
      ORDER BY wm.watched_at DESC
    `);
    return stmt.all() as any[];
  }

  // Get watched movies with chunk mappings
  getWatchedMoviesChunks() {
    const stmt = this.db.prepare(`
      SELECT wm.movie_id, cm.chunk_id
      FROM user_watched_movies wm
      LEFT JOIN chunk_mappings cm ON wm.movie_id = cm.movie_id
      ORDER BY wm.watched_at DESC
    `);
    return stmt.all() as any[];
  }

  // Check if movie is watched
  isMovieWatched(movieId: number): boolean {
    const stmt = this.db.prepare(
      "SELECT id FROM user_watched_movies WHERE movie_id = ?"
    );
    const result = stmt.get(movieId);
    return !!result;
  }

  // Add movie to watched list
  addMovieToWatched(movieId: number): void {
    const stmt = this.db.prepare(
      "INSERT INTO user_watched_movies (movie_id) VALUES (?)"
    );
    stmt.run(movieId);
  }

  // Remove movie from watched list
  removeMovieFromWatched(movieId: number): number {
    const stmt = this.db.prepare(
      "DELETE FROM user_watched_movies WHERE movie_id = ?"
    );
    const result = stmt.run(movieId);
    return result.changes;
  }

  // Clear all watched movies
  clearWatchedMovies(): void {
    const stmt = this.db.prepare("DELETE FROM user_watched_movies");
    stmt.run();
  }

  // Get watched movie count
  getWatchedMovieCount() {
    const stmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM user_watched_movies"
    );
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Public methods for watched status (used by legacy functions)
  addWatchedStatusToMovies(movies: any[]): any[] {
    if (!movies || movies.length === 0) return movies;

    // Get all watched movie IDs for the current user
    const watchedStmt = this.db.prepare(
      "SELECT movie_id FROM user_watched_movies"
    );
    const watchedMovies = watchedStmt.all() as { movie_id: number }[];
    const watchedMovieIds = new Set(watchedMovies.map((w) => w.movie_id));

    // Add watched status to each movie
    return movies.map((movie) => ({
      ...movie,
      isWatched: watchedMovieIds.has(movie.id),
    }));
  }

  addWatchedStatusToMovie(movie: any): any {
    if (!movie) return movie;

    const watchedStmt = this.db.prepare(
      "SELECT movie_id FROM user_watched_movies WHERE movie_id = ?"
    );
    const watched = watchedStmt.get(movie.id);

    return {
      ...movie,
      isWatched: !!watched,
    };
  }
}

// Admin operations
export class AdminService {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Create chunk_mappings table if it doesn't exist
  createChunkMappingsTable(): void {
    const stmt = this.db.prepare(`
      CREATE TABLE IF NOT EXISTS chunk_mappings (
        id TEXT PRIMARY KEY,
        movieId INTEGER NOT NULL,
        chunkIndex INTEGER NOT NULL,
        totalChunks INTEGER NOT NULL,
        source TEXT NOT NULL,
        FOREIGN KEY (movieId) REFERENCES movies(id)
      )
    `);
    stmt.run();
  }

  // Clear chunk mappings
  clearChunkMappings(): void {
    const stmt = this.db.prepare("DELETE FROM chunk_mappings");
    stmt.run();
  }

  // Prepare chunk_mappings table for new data (create if needed, clear existing)
  prepareChunkMappingsTable(): void {
    // Create table if it doesn't exist
    this.createChunkMappingsTable();
    // Clear existing data
    this.clearChunkMappings();
  }

  // Insert chunk mapping
  insertChunkMapping(
    chunkId: string,
    movieId: number,
    chunkIndex: number,
    totalChunks: number,
    source: string
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO chunk_mappings (id, movieId, chunkIndex, totalChunks, source) 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(chunkId, movieId, chunkIndex, totalChunks, source);
  }

  // Batch insert chunk mappings for better performance
  insertChunkMappingsBatch(chunkMappings: ChunkMapping[]): void {
    if (chunkMappings.length === 0) return;

    // Use a transaction for better performance and atomicity
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO chunk_mappings (chunk_id, movie_id, chunk_index, total_chunks, source) 
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const mapping of chunkMappings) {
        stmt.run(
          mapping.id,
          mapping.movieId,
          mapping.chunkIndex,
          mapping.totalChunks,
          mapping.source
        );
      }
    });

    transaction();
  }

  // Get chunk mappings by movie IDs
  // getChunkMappingsByMovieIds(movieIds: number[]) {
  //   if (movieIds.length === 0) return [];

  //   const placeholders = movieIds.map(() => "?").join(",");
  //   const stmt = this.db.prepare(`
  //     SELECT * FROM chunk_mappings
  //     WHERE movieId IN (${placeholders})
  //   `);
  //   return stmt.all(...movieIds) as any[];
  // }

  // Get all movies for embedding generation
  getAllMovies(): Movie[] {
    const stmt = this.db.prepare(`
      SELECT id, title, overview, plot, genre, release_date, vote_average 
      FROM movies 
      ORDER BY id
    `);
    return stmt.all() as Movie[];
  }
}

// Legacy functions for backward compatibility
export function addWatchedStatusToMovies(
  movies: any[],
  db: Database.Database
): any[] {
  const userService = new UserService();
  return userService.addWatchedStatusToMovies(movies);
}

export function addWatchedStatusToMovie(
  movie: any,
  db: Database.Database
): any {
  const userService = new UserService();
  return userService.addWatchedStatusToMovie(movie);
}
