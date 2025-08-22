const db = getDatabase();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Movie ID is required",
    });
  }

  try {
    // STEP 1: Fetch the current movie from database
    // This gives us the movie's title and plot to use as search query
    const stmt = db.prepare("SELECT * FROM movies WHERE id = ?");
    const currentMovie = stmt.get(id) as any;

    if (!currentMovie) {
      throw createError({
        statusCode: 404,
        statusMessage: "Movie not found",
      });
    }

    // STEP 2: Set up search filters
    // Exclude the current movie from search results to avoid self-recommendation
    const filter = { movie_id: { $ne: parseInt(id) } };
    console.log("Filter:", filter, "for movie ID:", id);

    // STEP 3: Perform hybrid search using both dense and sparse embeddings
    // This combines semantic understanding (dense) with keyword matching (sparse)
    const pc = await initPinecone();

    // Use plot if available, otherwise fallback to overview
    const searchText =
      currentMovie.plot || currentMovie.overview || currentMovie.title || "";

    // Truncate search text to stay within token limits
    const truncatedSearchText =
      searchText.length > 800
        ? searchText.substring(0, 800) + "..."
        : searchText;

    console.log("Search text:", truncatedSearchText.substring(0, 100) + "...");

    // Dense embeddings capture semantic meaning and context
    const denseIndex = pc.index(PINECONE_INDEXES.MOVIES_DENSE);
    const denseResults = await denseIndex.searchRecords({
      query: {
        inputs: {
          text: truncatedSearchText,
        },
        topK: 30, // Increased to get more chunks since we'll deduplicate by movie
        filter,
      },
    });
    console.log("Dense results:", denseResults.result.hits.length, "chunks");

    // Sparse embeddings capture specific keywords and phrases
    const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
    const sparseResults = await sparseIndex.searchRecords({
      query: {
        inputs: {
          text: truncatedSearchText,
        },
        topK: 30, // Increased to get more records since we'll deduplicate by movie
        filter,
      },
    });
    console.log("Sparse results:", sparseResults.result.hits.length, "records");

    // STEP 4: Combine and deduplicate results by movie_id
    // Since dense has chunks but sparse now has full plots, we need to handle them differently
    const movieChunkMap = new Map<string, any>();

    // Process dense results (chunks)
    denseResults.result.hits.forEach((hit, index) => {
      if (index < 3) {
        console.log(
          "Dense hit",
          index,
          "full structure:",
          JSON.stringify(hit, null, 2)
        );
      }
      // Access movie_id from fields, not metadata
      const movieId = (hit as any).fields?.movie_id;
      if (index < 3) {
        console.log("Dense hit fields:", (hit as any).fields);
        console.log("Extracted movieId:", movieId);
      }
      if (movieId) {
        const existingChunk = movieChunkMap.get(String(movieId));
        if (!existingChunk || (hit as any)._score > existingChunk._score) {
          movieChunkMap.set(String(movieId), {
            ...hit,
            source: "dense",
          });
        }
      }
    });

    // Process sparse results (full plots)
    sparseResults.result.hits.forEach((hit, index) => {
      if (index < 3) {
        console.log(
          "Sparse hit",
          index,
          "full structure:",
          JSON.stringify(hit, null, 2)
        );
      }
      // Sparse now uses direct movie ID instead of movie_id from fields
      const movieId = (hit as any).id;
      if (index < 3) {
        console.log("Sparse hit fields:", (hit as any).fields);
        console.log("Extracted movieId:", movieId);
      }
      if (movieId) {
        const existingChunk = movieChunkMap.get(String(movieId));
        if (!existingChunk || (hit as any)._score > existingChunk._score) {
          movieChunkMap.set(String(movieId), {
            ...hit,
            source: "sparse",
          });
        }
      }
    });

    console.log("Unique movies found:", movieChunkMap.size);

    // STEP 5: Prepare results for reranking
    // Convert to the format expected by the reranker
    const allDescriptions = Array.from(movieChunkMap.values()).map((hit) => {
      const fullText = (hit.fields as { text: string }).text;
      // Truncate text to stay within reranker's token limit (roughly 800 chars for safety)
      const truncatedText = fullText;
      // fullText.length > 800 ? fullText.substring(0, 800) + "..." : fullText;
      return {
        id: hit._id,
        text: truncatedText,
      };
    });

    console.log("Documents for reranking:", allDescriptions.length);

    // Check if we have any documents to rerank
    if (allDescriptions.length === 0) {
      console.log("No documents found for reranking, returning empty results");
      return {
        currentMovie: {
          id: currentMovie.id,
          title: currentMovie.title,
          genre: currentMovie.genre,
          release_date: currentMovie.release_date,
          vote_average: currentMovie.vote_average,
        },
        similarMovies: [],
      };
    }

    // STEP 6: Rerank candidates using a more sophisticated model
    // This step uses a cross-encoder to more accurately score similarity
    const rerankResults = await pc.inference.rerank(
      "bge-reranker-v2-m3",
      truncatedSearchText,
      allDescriptions,
      { topN: 6, rankFields: ["text"], returnDocuments: true }
    );
    console.log(
      "Rerank results:",
      rerankResults.data.map((movie) => movie.document?.id)
    );

    // STEP 7: Extract similarity scores from rerank results
    // Create a mapping of movie IDs to their final similarity scores
    const movieScoreMap = new Map<string, number>();
    rerankResults.data.forEach((doc, index) => {
      const movieId = doc.document?.id;
      if (movieId) {
        // Extract movie_id from chunk_id (format: movieId_chunk_index) for dense embeddings
        // For sparse embeddings, the ID is already the movie ID
        let movieIdFromResult;
        if (movieId.includes("_chunk_")) {
          movieIdFromResult = movieId.split("_chunk_")[0];
        } else {
          movieIdFromResult = movieId;
        }
        // Rerank scores are typically 0-1, representing similarity probability
        const similarityScore = doc.score || 0;
        movieScoreMap.set(movieIdFromResult, similarityScore);
      }
    });

    // STEP 8: Fetch full movie data from database
    // Get complete movie information for the top-scoring candidates
    const movieIds = Array.from(movieScoreMap.keys());
    const placeholders = movieIds.map(() => "?").join(",");
    const query = `SELECT * FROM movies WHERE id IN (${placeholders})`;
    const similarMovies = db.prepare(query).all(...movieIds);

    // STEP 9: Attach similarity scores to movie objects
    // Combine database movie data with calculated similarity scores
    const similarMoviesWithScores = similarMovies.map((movie: any) => {
      const score =
        movieScoreMap.get(movie.id) || movieScoreMap.get(String(movie.id)) || 0;
      return {
        ...movie,
        similarityScore: score,
      };
    });

    // STEP 10: Sort by similarity score for best recommendations first
    // Higher scores indicate more similar movies
    similarMoviesWithScores.sort(
      (a, b) => (b.similarityScore || 0) - (a.similarityScore || 0)
    );

    // STEP 11: Return results with similarity scores
    // Provide both current movie info and similar movies with their similarity percentages
    return {
      currentMovie: {
        id: currentMovie.id,
        title: currentMovie.title,
        genre: currentMovie.genre,
        release_date: currentMovie.release_date,
        vote_average: currentMovie.vote_average,
      },
      similarMovies: similarMoviesWithScores,
    };
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
