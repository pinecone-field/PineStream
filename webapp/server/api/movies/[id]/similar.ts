const movieService = new MovieService();

/**
 * This is the "Retrieval" part of the RAG pipeline.
 *
 * The endpoint calls this function passing the current movie
 * to find similar movies using sparse index search.
 *
 * The function returns an array of similar movies.
 */
async function retrieveSimilarMovies(currentMovie: any) {
  // =============================================================
  // PLACEHOLDER ID: similar-movies-retrieval
  // NOTE: Add your code for each step below.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  //
  // STEP 1: Prepare search text and metadata filters
  //
  //
  // STEP 2: Search the sparse index for similar chunks
  //
  //
  // STEP 3: Extract the highest scored movies from the search results
  //
  //
  // STEP 6: Get the top 10 movies from the database
  //

  return []; // DELETE THIS LINE

  //
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================
}

/**
 * This is the "Generation" part of the RAG pipeline.
 *
 * The endpoint calls this function passing the current movie and
 * an array of similar movies to generate similarity descriptions
 * between the `currentMovie` and each movie in the `batch`.
 *
 * The function is expected to call an LLM to generate the similarity descriptions
 * and returns an array of similarity descriptions.
 */
async function generateSimilarityDescriptions(currentMovie: any, batch: any[]) {
  // =============================================================
  // PLACEHOLDER ID: similar-movies-generation
  // NOTE: Add your code here. Replace the one below.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

  return batch.map(
    () => `Similar to ${currentMovie.title} in genre and style.`
  );

  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================
}

/**
 * This is the "Augment" step of the RAG pipeline.
 *
 * Augment movies with similarity descriptions using LLM in batches for parallel execution.
 */
async function augmentMoviesWithSimilarityDescriptions(
  currentMovie: any,
  similarMovies: any[]
) {
  try {
    // Split into 2 batches of 5 movies each for better reliability
    const batch1 = similarMovies.slice(0, 5);
    const batch2 = similarMovies.slice(5, 10);

    // Process both batches in parallel
    const [descriptions1, descriptions2] = await Promise.all([
      generateSimilarityDescriptions(currentMovie, batch1),
      generateSimilarityDescriptions(currentMovie, batch2),
    ]);

    // Combine descriptions
    const allDescriptions = [...descriptions1, ...descriptions2];

    // Map descriptions to movies
    return similarMovies.map((movie: any, index: number) => ({
      ...movie,
      similarityDescription:
        allDescriptions[index] ||
        `Similar to ${currentMovie.title} in genre and style.`,
    }));
  } catch (error) {
    console.error("Error generating similarity descriptions:", error);

    // Fallback: add generic descriptions if LLM fails
    return similarMovies.map((movie: any) => ({
      ...movie,
      similarityDescription: `Similar to ${currentMovie.title} in genre and style.`,
    }));
  }
}

function buildResponse(currentMovie: any, similarMovies: any[]) {
  return {
    currentMovie: {
      id: currentMovie.id,
      title: currentMovie.title,
      genre: currentMovie.genre,
      release_date: currentMovie.release_date,
      vote_average: currentMovie.vote_average,
    },
    similarMovies: similarMovies,
  };
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Movie ID is required",
    });
  }

  // Check if required APIs are available
  if (!isPineconeAvailable) {
    return {
      error: "API_UNAVAILABLE",
      message:
        "Similar movies are not available. Please configure your Pinecone API key.",
      status: "unavailable",
    };
  }

  try {
    // Get the current movie
    const currentMovie = movieService.getMovieById(id);
    if (!currentMovie) {
      throw createError({
        statusCode: 404,
        statusMessage: "Movie not found",
      });
    }

    // Retrieve similar movies
    const similarMovies = await retrieveSimilarMovies(currentMovie);
    if (similarMovies.length === 0) {
      return buildResponse(currentMovie, []);
    }

    // Augment similar movies with similarity descriptions
    const moviesWithDescriptions =
      await augmentMoviesWithSimilarityDescriptions(
        currentMovie,
        similarMovies
      );

    return buildResponse(currentMovie, moviesWithDescriptions);
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
