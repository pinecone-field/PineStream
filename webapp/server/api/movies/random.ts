const db = getDatabase();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const count = parseInt(query.count as string) || 10;

  // Limit count between 1 and 500
  const limitedCount = Math.max(1, Math.min(500, count));

  try {
    // Get random movies
    const randomMoviesStmt = db.prepare(`
      SELECT * FROM movies 
      ORDER BY RANDOM() 
      LIMIT ?
    `);
    const randomMovies = randomMoviesStmt.all(limitedCount) as any[];

    return {
      movies: randomMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre: movie.genre,
      })),
      count: randomMovies.length,
    };
  } catch (error) {
    console.error("Error fetching random movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
