import Database from 'better-sqlite3';
import { defineEventHandler, getQuery } from 'h3';

const db = new Database('movies.db');

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM movies');
    const { total } = countStmt.get() as { total: number };

    // Get movies with pagination
    const moviesStmt = db.prepare(`
      SELECT * FROM movies 
      ORDER BY popularity DESC, vote_average DESC 
      LIMIT ? OFFSET ?
    `);
    const movies = moviesStmt.all(limit, offset) as any[];

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    });
  }
}); 