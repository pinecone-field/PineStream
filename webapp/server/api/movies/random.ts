const movieService = new MovieService();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const count = parseInt(query.count as string) || 10;

  try {
    // Get random movies using the new MovieService
    const randomMovies = movieService.getRandomMovies(count);

    return {
      movies: randomMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre: movie.genre,
        isWatched: movie.isWatched,
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
