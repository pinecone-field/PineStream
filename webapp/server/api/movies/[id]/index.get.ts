const movieService = new MovieService();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Movie ID is required",
    });
  }

  try {
    // Get movie by ID using the new MovieService
    const movie = movieService.getMovieById(id);

    if (!movie) {
      throw createError({
        statusCode: 404,
        statusMessage: "Movie not found",
      });
    }

    return movie;
  } catch (error) {
    console.error("Error fetching movie:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
