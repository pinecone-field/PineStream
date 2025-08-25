const movieService = new MovieService();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;

  try {
    // Get movies with pagination using the new MovieService
    const { movies, total, totalPages } = movieService.getMoviesWithPagination(
      page,
      limit
    );

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
