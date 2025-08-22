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
    const stmt = db.prepare("SELECT * FROM movies WHERE id = ?");
    const currentMovie = stmt.get(id) as any;

    if (!currentMovie) {
      throw createError({
        statusCode: 404,
        statusMessage: "Movie not found",
      });
    }

    // STEP 2: Combine plot and overview text for search
    const plotText = currentMovie.plot || "";
    const overviewText = currentMovie.overview || "";
    const combinedText = [plotText, overviewText]
      .filter((text) => text.trim())
      .join(" ");

    if (!combinedText.trim()) {
      // If no text available, return empty results
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

    // Extract genre categories for filtering
    const currentGenres = currentMovie.genre
      ? currentMovie.genre
          .split(",")
          .map((g: string) => g.trim().toLowerCase())
          .filter((g: string) => g.length > 0)
      : [];

    console.log("Current movie genres:", currentGenres);
    console.log("Search text length:", combinedText.length);
    console.log("Search text preview:", combinedText.substring(0, 200) + "...");

    // STEP 3: Initialize Pinecone and get sparse index
    const pc = await initPinecone();
    const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);

    // STEP 4: Search sparse index for similar movies
    const searchResults = await sparseIndex.searchRecords({
      query: {
        inputs: {
          text: combinedText,
        },
        topK: 50, // Increased to get more results since we'll filter by genre
        filter: {
          movie_id: { $ne: parseInt(id) }, // Exclude current movie
          ...(currentGenres.length > 0 && {
            genre: { $in: currentGenres }, // Filter by matching genres
          }),
        },
      },
    });

    console.log(
      "Sparse search results:",
      searchResults.result.hits.length,
      "records"
    );

    if (currentGenres.length > 0) {
      console.log(`Filtered by genres: ${currentGenres.join(", ")}`);
    }

    // STEP 5: Extract movie IDs and scores from results
    const movieScoreMap = new Map<string, number>();

    searchResults.result.hits.forEach((hit) => {
      const movieId = (hit.fields as any).movie_id;
      const score = hit._score || 0;

      if (movieId) {
        // // Extract movie ID from the result ID (format: movieId_source)
        // let movieIdFromResult;
        // if (movieId.includes("_plot") || movieId.includes("_overview")) {
        //   movieIdFromResult = movieId.split("_")[0];
        // } else {
        //   movieIdFromResult = movieId;
        // }

        // Keep the highest score if we have multiple results for the same movie
        const existingScore = movieScoreMap.get(movieId) || 0;
        if (score > existingScore) {
          movieScoreMap.set(movieId, score);
        }
      }
    });

    console.log("Unique movies found:", movieScoreMap.size);

    // STEP 6: Fetch full movie data from database
    const movieIds = Array.from(movieScoreMap.keys());

    if (movieIds.length === 0) {
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

    const placeholders = movieIds.map(() => "?").join(",");
    const query = `SELECT * FROM movies WHERE id IN (${placeholders})`;
    const similarMovies = db.prepare(query).all(...movieIds);

    // STEP 7: Attach similarity scores and sort by score
    const similarMoviesWithScores = similarMovies.map((movie: any) => {
      const score = movieScoreMap.get(String(movie.id)) || 0;
      return {
        ...movie,
        similarityScore: score,
      };
    });

    // Sort by similarity score (higher scores = more similar)
    similarMoviesWithScores.sort(
      (a, b) => (b.similarityScore || 0) - (a.similarityScore || 0)
    );

    // Take top 10 results
    const topResults = similarMoviesWithScores.slice(0, 10);

    console.log("Returning", topResults.length, "similar movies");

    // STEP 8: Return results
    return {
      currentMovie: {
        id: currentMovie.id,
        title: currentMovie.title,
        genre: currentMovie.genre,
        release_date: currentMovie.release_date,
        vote_average: currentMovie.vote_average,
      },
      similarMovies: topResults,
    };
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
