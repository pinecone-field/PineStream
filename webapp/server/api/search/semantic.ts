const db = getDatabase();

// Interface for extracted filter criteria
interface SearchFilters {
  genres?: string[]; // Array of genres
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  hasFilters: boolean;
  userMessage?: string; // User-friendly message about what was detected
  rephrasedQuery?: string; // Better version of the query for vector search
}

// Helper function to extract JSON from response text
function extractJSONFromResponse(response: string): string {
  // Look for JSON object in the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return "{}";
}

// Analyze search query to extract genres and date range for Pinecone metadata filtering
async function analyzeSearchQuery(searchQuery: string): Promise<SearchFilters> {
  const systemPrompt = `You are a movie search query analyzer. 
Extract the intent from user queries and construct JSON object for vector database metadata filtering.

Return ONLY a JSON object with this structure:
{
  "genres": ["genre1", "genre2"] or null,
  "dateRange": {
    "start": "YYYY-MM-DD or null",
    "end": "YYYY-MM-DD or null"
  },
  "rephrasedQuery": "Better version of the query considering the filters will be applied. Or the same query if no filters were detected.",
  "userMessage": "A natural, user-friendly message explaining what filter were detected from the query."
  "hasFilters": "boolean indicating if any filters were found",
}

RULES:
Available genres: action, comedy, drama, horror, sci-fi, romance, thriller, documentary, animation, fantasy, adventure, crime, mystery, western, musical, war, family, history, biography, sport, etc.
Always return the genres in lowercase. If you are not sure about the genre, return null.

For date ranges, extract the actual start and end dates in ISO format (YYYY-MM-DD):
- Decades: "90s" → start: "1990-01-01", end: "1999-12-31"
- Specific years: "2020" → start: "2020-01-01", end: "2020-12-31"
- Year ranges: "1995 to 2000" → start: "1995-01-01", end: "2000-12-31"
- Before/after: "before 2000" → start: "1900-01-01", end: "1999-12-31"
- Recent: "recent movies" → start: "2020-01-01", end: "2024-12-31"

The rephrased query must not loose any context of the original query has.
However, the rephrasedQuery should not have information that was converted to filters.
If the user's query contains solely information that was converted to filters, 
the rephrased query should be a text that matches every very vector in the vector store.


EXAMPLES:
Query: "car chasing movie from the 90s" → {"genres": ["action"], "dateRange": {"start": "1990-01-01", "end": "1999-12-31"}, "rephrasedQuery": "car chasing ", "userMessage": "Based on your request, we filtered movies by \`action\` genres released in \`1990 - 1999\` time period.", "hasFilters": true}
Query: "comedy films from 2020" → {"genres": ["comedy"], "dateRange": {"start": "2020-01-01", "end": "2020-12-31"}, "rephrasedQuery": "any movie", "userMessage": "Based on your request, we filtered movies by comedy \`genres\` and released in \`2020\`.", "hasFilters": true}
Query: "robots exploring space and fighting aliens" → {"genres": ["action", "adventure", "sci-fi"], "dateRange": null, "rephrasedQuery": "robots exploring space and fighting aliens", "userMessage": "Based on your request, we filtered movies by \`action\`, \`adventure\`, and \`sci-fi\` genres.", "hasFilters": true}
`;
  const groq = await initGroq();
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: searchQuery },
      ],
      model: GROQ_MODELS.GEMMA2_9B,
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content || "{}";
    console.log("Raw Groq response:", response);

    try {
      // Extract JSON from the response (in case it includes explanatory text)
      const jsonString = extractJSONFromResponse(response);
      const filters = JSON.parse(jsonString) as SearchFilters;

      console.log("Parsed filters:", filters);

      return {
        genres: filters.genres || undefined,
        dateRange: filters.dateRange || undefined,
        hasFilters: filters.hasFilters || false,
        userMessage:
          filters.userMessage || "We found movies matching your description.",
        rephrasedQuery: filters.rephrasedQuery || searchQuery,
      };
    } catch (parseError) {
      console.error("Failed to parse Groq response:", response);
      console.error("Parse error:", parseError);
      return {
        hasFilters: false,
        userMessage: "We found movies matching your description.",
        rephrasedQuery: searchQuery,
      };
    }
  } catch (error) {
    console.error("Error analyzing search query:", error);
    return {
      hasFilters: false,
      userMessage: "We found movies matching your description.",
      rephrasedQuery: searchQuery,
    };
  }
}

export default defineEventHandler(async (event) => {
  // Handle POST request with body
  const body = await readBody(event);
  console.log("POST body received:", body);

  const searchDescription = body.description as string;
  const limit = Math.min(parseInt(String(body.limit)) || 50, 50);

  if (!searchDescription) {
    return {
      movies: [],
      total: 0,
    };
  }

  try {
    console.log(
      "Semantic search requested with description:",
      searchDescription
    );

    // Analyze the search query using Groq to extract genres and date range
    const filters = await analyzeSearchQuery(searchDescription);
    console.log("Extracted filters for Pinecone metadata filtering:", filters);

    const pc = await initPinecone();
    const index = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

    // Build metadata filter for Pinecone
    const metadataFilter: any = {};

    if (filters.genres && filters.genres.length > 0) {
      // Handle multiple genres - use $in to check if any of the genres exist in the array
      // Ensure genres are lowercase to match how they're stored in embeddings
      const normalizedGenres = filters.genres.map((g) => g.toLowerCase());
      metadataFilter.genre = { $in: normalizedGenres };
    }

    if (filters.dateRange) {
      // Convert ISO date strings to timestamps for Pinecone numeric filtering
      const startTimestamp = new Date(filters.dateRange.start).getTime();
      const endTimestamp = new Date(filters.dateRange.end).getTime();

      metadataFilter.release_date = {
        $gte: startTimestamp,
        $lte: endTimestamp,
      };
    }

    console.log("Pinecone metadata filter:", metadataFilter);

    // STEP 3: Perform hybrid search using both dense and sparse embeddings
    // This combines semantic understanding (dense) with keyword matching (sparse)

    // Dense embeddings capture semantic meaning and context
    const denseIndex = pc.index(PINECONE_INDEXES.MOVIES_DENSE);
    const denseSearchOptions: any = {
      query: {
        inputs: { text: searchDescription },
        topK: limit * 3, // Get more chunks since we'll deduplicate by movie
      },
    };
    if (filters.hasFilters && Object.keys(metadataFilter).length > 0) {
      denseSearchOptions.filter = metadataFilter;
    }
    const denseResults = await denseIndex.searchRecords(denseSearchOptions);
    console.log("Dense results:", denseResults.result.hits.length, "chunks");

    // Sparse embeddings capture specific keywords and phrases
    const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
    const sparseSearchOptions: any = {
      query: {
        inputs: { text: searchDescription },
        topK: limit * 3, // Get more records since we'll deduplicate by movie
      },
    };
    if (filters.hasFilters && Object.keys(metadataFilter).length > 0) {
      sparseSearchOptions.filter = metadataFilter;
    }
    const sparseResults = await sparseIndex.searchRecords(sparseSearchOptions);
    console.log("Sparse results:", sparseResults.result.hits.length, "records");

    // STEP 4: Extract unique movie IDs from both search results
    const uniqueMovieIds = new Set<number>();

    // Extract movie IDs from dense results (chunks)
    denseResults.result.hits.forEach((hit) => {
      const movieId = (hit as any).fields?.movie_id;
      if (movieId) {
        uniqueMovieIds.add(movieId);
      }
    });

    // Extract movie IDs from sparse results (full plots)
    sparseResults.result.hits.forEach((hit) => {
      const movieId = (hit as any).id; // Sparse now uses direct movie ID
      if (movieId) {
        uniqueMovieIds.add(parseInt(movieId));
      }
    });

    console.log("Unique movies found:", uniqueMovieIds.size);

    // STEP 5: Fetch movie plots from database for reranking
    if (uniqueMovieIds.size === 0) {
      console.log("No movies found, returning empty results");
      return {
        movies: [],
        total: 0,
        filters: filters.hasFilters ? filters : undefined,
      };
    }

    const movieIdsArray = Array.from(uniqueMovieIds);
    const placeholders = movieIdsArray.map(() => "?").join(",");
    const query = `SELECT id, title, plot, overview FROM movies WHERE id IN (${placeholders})`;
    const moviePlots = db.prepare(query).all(...movieIdsArray) as Array<{
      id: number;
      title: string;
      plot: string | null;
      overview: string | null;
    }>;

    // STEP 6: Prepare movie plots for reranking
    const allDescriptions = moviePlots.map((movie) => {
      // Use plot if available, otherwise fallback to overview
      const plotText = movie.plot || movie.overview || movie.title || "";
      return {
        id: String(movie.id), // Convert to string for reranker
        text: plotText,
      };
    });

    console.log("Movies prepared for reranking:", allDescriptions.length);

    // STEP 7: Rerank movies using the sophisticated model
    const rerankResults = await pc.inference.rerank(
      "bge-reranker-v2-m3",
      searchDescription,
      allDescriptions,
      { topN: limit, rankFields: ["text"], returnDocuments: true }
    );
    console.log(
      "Rerank results:",
      rerankResults.data.map((movie) => movie.document?.id)
    );

    // STEP 8: Extract similarity scores and fetch full movie data
    const movieScoreMap = new Map<string, number>();
    rerankResults.data.forEach((doc) => {
      const movieId = doc.document?.id;
      if (movieId) {
        const similarityScore = doc.score || 0;
        movieScoreMap.set(String(movieId), similarityScore);
      }
    });

    let movies: any[] = [];
    if (movieScoreMap.size > 0) {
      // Get movie IDs from reranked results
      const movieIds = Array.from(movieScoreMap.keys());

      const placeholders = movieIds.map(() => "?").join(",");
      const query = `SELECT * FROM movies WHERE id IN (${placeholders})`;
      movies = db.prepare(query).all(...movieIds);

      // Add similarity scores to each movie
      movies = movies.map((movie) => {
        const score =
          movieScoreMap.get(movie.id) ||
          movieScoreMap.get(String(movie.id)) ||
          0;
        return {
          ...movie,
          similarityScore: score,
        };
      });

      // Limit to the requested number of results
      movies = movies
        .slice(0, limit)
        .sort((a, b) => b.similarityScore - a.similarityScore);
    }

    return {
      movies,
      total: movies.length,
      filters: filters.hasFilters ? filters : undefined, // Include filters in response if any were found
    };
  } catch (error) {
    console.error("Error in semantic search:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
