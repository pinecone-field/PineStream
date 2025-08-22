const db = getDatabase();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const searchTerm = query.q as string;
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  if (!searchTerm) {
    return {
      movies: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }

  try {
    // Token-based search across title, overview, and genre
    const searchStmt = db.prepare(`
      SELECT * FROM movies 
      WHERE title LIKE ? OR overview LIKE ? OR genre LIKE ?
      ORDER BY popularity DESC, vote_average DESC 
      LIMIT ? OFFSET ?
    `);

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM movies 
      WHERE title LIKE ? OR overview LIKE ? OR genre LIKE ?
    `);

    const searchPattern = `%${searchTerm}%`;
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

    // Add watched status to movies
    const moviesWithWatchedStatus = addWatchedStatusToMovies(movies, db);

    return {
      movies: moviesWithWatchedStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error searching movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
