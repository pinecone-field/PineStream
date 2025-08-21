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
