const userService = new UserService();
const movieService = new MovieService();

export default defineEventHandler(async (event) => {
  // Check if required APIs are available
  if (!isPineconeAvailable) {
    return {
      error: "API_UNAVAILABLE",
      message:
        "AI recommendations are not available. Please configure your Pinecone API key.",
      status: "unavailable",
    };
  }

  try {
    // Get watched movie IDs and their chunk IDs using the new UserService
    const watchedResults = userService.getWatchedMoviesChunks();

    if (watchedResults.length === 0) {
      // If no watched movies, return empty recommendations
      return {
        recommendations: [],
        watchedCount: 0,
      };
    }

    // Extract unique movie IDs and chunk IDs
    const watchedIds = [...new Set(watchedResults.map((row) => row.movie_id))];
    const chunkIds = watchedResults
      .map((row) => row.chunk_id)
      .filter((chunkId) => chunkId !== null); // Filter out nulls from LEFT JOIN

    // If no chunks found, return empty list
    if (chunkIds.length === 0) {
      return {
        recommendations: [],
        watchedCount: watchedIds.length,
      };
    }

    // Get embeddings from the dense index using Pinecone
    const pc = await getPineconeClient();

    const indexParamsResponse = await pc.describeIndex(
      PINECONE_INDEXES.MOVIES_DENSE
    );
    const dimension = indexParamsResponse.dimension;

    if (!dimension) {
      throw createError({
        statusCode: 500,
        statusMessage: "Dimension not found",
      });
    }

    const centroid = new Array(dimension).fill(0);

    const denseIndex = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

    // Fetch embeddings for all chunks of watched movies
    const fetchResponse = await denseIndex.fetch(chunkIds);
    const vectors = Object.values(fetchResponse.records).map(
      (record: any) => record.values
    );

    if (vectors.length === 0) {
      // If no embeddings found, return empty list
      return {
        recommendations: [],
        watchedCount: watchedIds.length,
      };
    }

    // Create centroid from all chunk embeddings
    vectors.forEach((vector: number[]) => {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    });

    // Average the centroid
    centroid.forEach((value, index) => {
      centroid[index] = value / vectors.length;
    });

    // Search for similar chunks using the centroid, excluding watched movie chunks
    const queryResponse = await denseIndex.query({
      vector: centroid,
      topK: 50, // Get more results since we'll deduplicate by movie
      filter: {
        movie_id: { $nin: watchedIds },
      },
      includeMetadata: true,
    });

    // Extract movie IDs from recommendations and deduplicate
    const recommendedMovieIds = new Set<number>();
    queryResponse.matches.forEach((match: any) => {
      const movieId = match.metadata?.movie_id;
      if (movieId && !isNaN(movieId)) {
        recommendedMovieIds.add(movieId);
      }
    });

    // Fetch movie details for recommendations
    let recommendations: any[] = [];
    if (recommendedMovieIds.size > 0) {
      const movieIdsArray = Array.from(recommendedMovieIds);
      recommendations = movieService.getMoviesByIds(movieIdsArray, {
        limit: 10,
      });
    }

    // If no recommendations found, return empty list
    // No fallback to random movies - user should watch some movies first

    return {
      recommendations: recommendations.map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre: movie.genre,
        overview: movie.overview,
      })),
      watchedCount: watchedIds.length,
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
