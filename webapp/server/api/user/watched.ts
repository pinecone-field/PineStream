const userService = new UserService();
const movieService = new MovieService();

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    switch (method) {
      case "GET":
        // Get all watched movies using the new UserService
        const watchedMovies = userService.getWatchedMovies();

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

        // Check if movie exists using the new MovieService
        const movie = movieService.getMovieById(movieId);

        if (!movie) {
          throw createError({
            statusCode: 404,
            statusMessage: "Movie not found",
          });
        }

        // Check if already watched using the new UserService
        if (userService.isMovieWatched(movieId)) {
          return { message: "Movie already in watched list" };
        }

        // Add to watched list using the new UserService
        userService.addMovieToWatched(movieId);

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

        // Remove from watched list using the new UserService
        const changes = userService.removeMovieFromWatched(deleteMovieId);

        if (changes === 0) {
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
