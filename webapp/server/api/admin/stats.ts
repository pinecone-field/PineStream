const movieService = new MovieService();
const userService = new UserService();

async function getEmbeddingsCounts(): Promise<{
  dense: number;
  sparse: number;
}> {
  try {
    const pc = await getPineconeClient();

    // Make both API calls in parallel for better performance
    const [denseStats, sparseStats] = await Promise.all([
      pc.index(PINECONE_INDEXES.MOVIES_DENSE).describeIndexStats(),
      pc.index(PINECONE_INDEXES.MOVIES_SPARSE).describeIndexStats(),
    ]);

    return {
      dense: denseStats.totalRecordCount || 0,
      sparse: sparseStats.totalRecordCount || 0,
    };
  } catch (error) {
    console.error("Error getting embeddings counts:", error);
    return { dense: 0, sparse: 0 };
  }
}

export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    // Get database stats using the new service classes
    const [totalMovies, watchedMovies] = await Promise.all([
      Promise.resolve(movieService.getMovieCount()),
      Promise.resolve(userService.getWatchedMovieCount()),
    ]);

    // Get embedding counts from Pinecone (optimized with parallel calls)
    const embeddings = await getEmbeddingsCounts();

    return {
      totalMovies,
      watchedMovies,
      denseEmbeddings: embeddings.dense,
      sparseEmbeddings: embeddings.sparse,
    };
  } catch (error) {
    console.error("Error fetching database stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
