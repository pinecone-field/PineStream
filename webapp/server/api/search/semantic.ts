const movieService = new MovieService();

// Interface for extracted search insight and optimization
interface SearchInsight {
  genres?: string[]; // Array of genres
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  hasFilters: boolean;
  userMessage?: string; // User-friendly message about what was detected
  denseQuery?: string; // Optimized query for dense vector search
  sparseQuery?: string; // Optimized query for sparse vector search
}

const emptyInsight = (searchQuery: string): SearchInsight => {
  return {
    hasFilters: false,
    userMessage: "Insight extraction is not available.",
    denseQuery: searchQuery,
    sparseQuery: searchQuery,
    genres: undefined,
    dateRange: undefined,
  };
};

/**
 * This is the "Retrieval" part of the GAR (Generation Augmented Retrieval) pipeline.
 *
 * The endpoint calls this function passing
 *  - the query text for the vector search
 *  - a metadata filter
 *  - the index name
 *  - a  limit for the number of results to return.
 *
 * The function is expected to retrieve the IDs of the movies matching the query
 *
 * The function works with both dense and sparse indexes.
 * The actual matching is done by Pinecone based on the index type, distance metric, and dimensions.
 */
async function doVectorSearch(
  searchText: string,
  limit: number,
  metadataFilter: any,
  indexName: string
): Promise<Set<number>> {
  const movieIds = new Set<number>();

  // =============================================================
  // PLACEHOLDER: Add your code here.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================

  return movieIds;
}

/**
 * This is the "Reranking" step following up the hybrid search.
 *
 * The endpoint calls this function passing:
 *  - the list of movie IDs to rerank
 *  - the original search text for context
 *  - the limit for final results
 *
 * The function is expected to:
 *  1. Fetch movie plots from the database
 *  2. Rerank movies using a sophisticated reranker model
 *  3. Return the reranked movies with similarity scores
 */
async function getHighestRankedMovies(
  movieIds: Set<number>,
  searchText: string,
  limit: number
): Promise<any[]> {
  let highestRankedMovies: any[] = [];

  if (movieIds.size === 0) {
    return highestRankedMovies;
  }

  // =============================================================
  // PLACEHOLDER: Add your code here.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================

  return highestRankedMovies;
}

/**
 * This is the "Generation" part of the GAR (Generation Augmented Retrieval) pipeline.
 *
 * The endpoint calls this function passing the query text from the user.
 *
 * The function is expected to get the following insights about the query:
 *  - possible filters to use for the vector search (genres, date range)
 *  - optimized queries for the vector search (dense and sparse)
 *  - user message to explain the what was detected in the query
 *
 * The function is expected to return the insight in a JSON object.
 */
async function getSearchInsight(searchQuery: string): Promise<SearchInsight> {
  // Check if we can call an LLM via Groq
  let insight: SearchInsight = emptyInsight(searchQuery);
  if (!isGroqAvailable) {
    return insight;
  }

  // =============================================================
  // PLACEHOLDER: Add your code here.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================

  return insight;
}

export default defineEventHandler(async (event) => {
  // Handle POST request with body
  const body = await readBody(event);

  const searchText = body.description as string;
  const limit = Math.min(parseInt(String(body.limit)) || 50, 50);

  if (!searchText) {
    return {
      movies: [],
      total: 0,
    };
  }

  // Check if required APIs are available
  if (!isPineconeAvailable) {
    return {
      error: "API_UNAVAILABLE",
      message:
        "Vector search is not available. Please configure your Pinecone API key.",
      status: "unavailable",
    };
  }

  try {
    // Get the insight about the query
    const insight = await getSearchInsight(searchText);

    // Build metadata filter from the insight
    const metadataFilter: any = {};

    if (insight.genres && insight.genres.length > 0) {
      // Handle multiple genres - use $in to check if any of the genres exist in the array
      // Ensure genres are lowercase to match how they're stored in embeddings
      const normalizedGenres = insight.genres.map((g) => g.toLowerCase());
      metadataFilter.genre = { $in: normalizedGenres };
    }

    if (insight.dateRange) {
      // Convert ISO date strings to timestamps for Pinecone numeric filtering
      const startTimestamp = dateToNumber(insight.dateRange.start);
      const endTimestamp = dateToNumber(insight.dateRange.end);

      // Build filter with available timestamps
      if (startTimestamp || endTimestamp) {
        metadataFilter.release_date = {};
        if (startTimestamp) {
          metadataFilter.release_date.$gte = startTimestamp;
        }
        if (endTimestamp) {
          metadataFilter.release_date.$lte = endTimestamp;
        }
      }
    }

    // Perform hybrid search using both dense and sparse embeddings
    const denseQuery = insight.denseQuery || searchText;
    const sparseQuery = insight.sparseQuery || searchText;

    const [denseIds, sparseIds] = await Promise.all([
      doVectorSearch(
        denseQuery, // Use optimized dense query if available
        limit * 3, // Get more chunks as some may be about the same movie
        metadataFilter,
        PINECONE_INDEXES.MOVIES_DENSE
      ),
      doVectorSearch(
        sparseQuery, // Use optimized sparse query if available
        limit * 2, // Get more chunks as some may be about the same movie
        metadataFilter,
        PINECONE_INDEXES.MOVIES_SPARSE
      ),
    ]);

    // Merge the results from both search methods
    const uniqueMovieIds = new Set([...denseIds, ...sparseIds]);
    if (uniqueMovieIds.size === 0) {
      return {
        movies: [],
        total: 0,
        insight: insight.hasFilters ? insight : undefined,
      };
    }

    const movies = await getHighestRankedMovies(
      uniqueMovieIds,
      searchText,
      limit
    );

    return {
      movies,
      total: movies.length,
      insight: insight.hasFilters ? insight : undefined, // Include filters in response if any were found
    };
  } catch (error) {
    console.error("Error in semantic search:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
