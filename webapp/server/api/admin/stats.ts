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
    // Get database stats using the new service classes (these don't require Pinecone)
    const [totalMovies, watchedMovies] = await Promise.all([
      Promise.resolve(movieService.getMovieCount()),
      Promise.resolve(userService.getWatchedMovieCount()),
    ]);

    // Check if Pinecone is available for embedding counts
    if (!isPineconeAvailable) {
      return {
        totalMovies,
        watchedMovies,
        denseEmbeddings: null,
        sparseEmbeddings: null,
        isPineconeAvailable: false,
      };
    }

    // Get embedding counts from Pinecone (only if available)
    const embeddings = await getEmbeddingsCounts();

    return {
      totalMovies,
      watchedMovies,
      denseEmbeddings: embeddings.dense,
      sparseEmbeddings: embeddings.sparse,
      isPineconeAvailable: true,
    };
  } catch (error) {
    console.error("Error fetching database stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
