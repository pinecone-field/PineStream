import Database from "better-sqlite3";

const db = new Database("movies.db");

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
    // This gives us the movie's title and description to use as search query
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
    const filter = { title: { $ne: currentMovie.title } };

    // STEP 3: Perform hybrid search using both dense and sparse embeddings
    // This combines semantic understanding (dense) with keyword matching (sparse)
    const pc = await initPinecone();

    // Dense embeddings capture semantic meaning and context
    const denseIndex = pc.index(PINECONE_INDEXES.MOVIES_DENSE);
    const denseResults = await denseIndex.searchRecords({
      query: {
        inputs: {
          text: `${currentMovie.title} \n ${currentMovie.description}`,
        },
        topK: 10,
        filter,
      },
    });
    console.log("Dense results:", denseResults.result.hits);

    // Sparse embeddings capture specific keywords and phrases
    const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
    const sparseResults = await sparseIndex.searchRecords({
      query: {
        inputs: {
          text: `${currentMovie.title} \n ${currentMovie.description}`,
        },
        topK: 10,
        filter,
      },
    });
    console.log("Sparse results:", sparseResults.result.hits);

    // STEP 4: Combine and prepare results for reranking
    // Merge dense and sparse results to get a comprehensive set of candidates
    const allDescriptions = [
      ...denseResults.result.hits,
      ...sparseResults.result.hits,
    ].map((hit) => {
      return {
        id: hit._id,
        text: (hit.fields as { text: string }).text,
      };
    });

    // STEP 5: Rerank candidates using a more sophisticated model
    // This step uses a cross-encoder to more accurately score similarity
    const rerankResults = await pc.inference.rerank(
      "bge-reranker-v2-m3",
      `${currentMovie.title} \n ${currentMovie.description}`,
      allDescriptions,
      { topN: 10, rankFields: ["text"], returnDocuments: true }
    );
    console.log(
      "Rerank results:",
      rerankResults.data.map((movie) => movie.document?.id)
    );

    // STEP 6: Extract similarity scores from rerank results
    // Create a mapping of movie IDs to their final similarity scores
    const movieScoreMap = new Map<string, number>();
    rerankResults.data.forEach((doc, index) => {
      const movieId = doc.document?.id;
      if (movieId) {
        // Rerank scores are typically 0-1, representing similarity probability
        const similarityScore = doc.score || 0;
        movieScoreMap.set(movieId, similarityScore);
      }
    });

    // STEP 7: Fetch full movie data from database
    // Get complete movie information for the top-scoring candidates
    const movieIds = Array.from(movieScoreMap.keys());
    const placeholders = movieIds.map(() => "?").join(",");
    const query = `SELECT * FROM movies WHERE id IN (${placeholders})`;
    const similarMovies = db.prepare(query).all(...movieIds);

    // STEP 8: Attach similarity scores to movie objects
    // Combine database movie data with calculated similarity scores
    const similarMoviesWithScores = similarMovies.map((movie: any) => {
      const score =
        movieScoreMap.get(movie.id) || movieScoreMap.get(String(movie.id)) || 0;
      return {
        ...movie,
        similarityScore: score,
      };
    });

    // STEP 9: Sort by similarity score for best recommendations first
    // Higher scores indicate more similar movies
    similarMoviesWithScores.sort(
      (a, b) => (b.similarityScore || 0) - (a.similarityScore || 0)
    );

    // STEP 10: Return results with similarity scores
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
