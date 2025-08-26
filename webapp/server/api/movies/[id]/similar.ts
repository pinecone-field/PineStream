const movieService = new MovieService();

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
    // STEP 1: Fetch the current movie from database using MovieService
    const currentMovie = movieService.getMovieById(id);

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

    // If no text available, return empty results
    if (!combinedText.trim()) {
      return buildResponse(currentMovie, []);
    }

    // Extract genre categories for filtering
    const currentGenres = currentMovie.genre
      ? currentMovie.genre
          .split(",")
          .map((g: string) => g.trim().toLowerCase())
          .filter((g: string) => g.length > 0)
      : [];

    // STEP 3: Initialize Pinecone and get sparse index
    const pc = await getPineconeClient();
    const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);

    // STEP 4: Search sparse index for similar movies
    const searchResults = await sparseIndex.searchRecords({
      query: {
        inputs: {
          text: combinedText,
        },
        topK: 20, // Only need 20 results since we want 10 movies and have 2 vectors per movie
        filter: {
          movie_id: { $ne: parseInt(id) }, // Exclude current movie
          ...(currentGenres.length > 0 && {
            genre: { $in: currentGenres }, // Filter by matching genres
          }),
        },
      },
    });

    // STEP 5: Extract movie IDs and scores from results
    const movieScoreMap = new Map<string, number>();

    searchResults.result.hits.forEach((hit) => {
      const movieId = (hit.fields as any).movie_id;
      const score = hit._score || 0;

      if (movieId) {
        const existingScore = movieScoreMap.get(movieId) || 0;
        if (score > existingScore) {
          movieScoreMap.set(movieId, score);
        }
      }
    });

    // STEP 6: Fetch full movie data from database
    const movieIds = Array.from(movieScoreMap.keys());

    if (movieIds.length === 0) {
      return buildResponse(currentMovie, []);
    }

    // Fetch full movie data using the new MovieService
    const similarMovies = movieService.getMoviesByIds(
      movieIds.map((id) => parseInt(id)),
      { includeWatched: true }
    );

    // Sort by similarity score (higher scores = more similar)
    similarMovies.sort(
      (a: any, b: any) =>
        (movieScoreMap.get(b.id) || 0) - (movieScoreMap.get(a.id) || 0)
    );

    // Take top 10 results - no need for deduplication since Map already handles it
    const topResults = similarMovies.slice(0, 10);

    // STEP 7: Generate similarity descriptions using Groq LLM
    let moviesWithDescriptions: Array<any> = topResults;

    if (topResults.length > 0) {
      try {
        // Process movies in small batches to avoid overwhelming the model
        let allDescriptions: string[] = [];

        // Split into 2 batches of 5 movies each for better reliability
        const batch1 = topResults.slice(0, 5);
        const batch2 = topResults.slice(5, 10);

        try {
          // Process both batches in parallel
          const [descriptions1, descriptions2] = await Promise.all([
            addSimilarityDescriptions(currentMovie, batch1),
            addSimilarityDescriptions(currentMovie, batch2),
          ]);

          // Combine descriptions
          allDescriptions = [...descriptions1, ...descriptions2];

          // // Ensure we have enough descriptions
          // while (allDescriptions.length < topResults.length) {
          //   allDescriptions.push(
          //     `Similar to ${currentMovie.title} in genre and style.`
          //   );
          // }
        } catch (error) {
          console.error("Error generating similarity descriptions:", error);
          // Fallback: add generic descriptions if LLM fails
          allDescriptions = topResults.map(
            () => `Similar to ${currentMovie.title} in genre and style.`
          );
        }

        // Map descriptions to movies
        moviesWithDescriptions = topResults.map(
          (movie: any, index: number) => ({
            ...movie,
            similarityDescription:
              allDescriptions[index] ||
              `Similar to ${currentMovie.title} in genre and style.`,
          })
        );
      } catch (llmError) {
        console.error("Error generating similarity descriptions:", llmError);
        // Fallback: add generic descriptions if LLM fails
        moviesWithDescriptions = topResults.map((movie: any) => ({
          ...movie,
          similarityDescription: `Similar to ${currentMovie.title} in genre and style.`,
        }));
      }
    }

    // STEP 8: Return results
    return buildResponse(currentMovie, moviesWithDescriptions);
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }

  function buildPrompt(referenceMovie: any, similarMovies: any[]) {
    return `
      Reference Movie: \n${referenceMovie.title}
      Plot: \n${
        referenceMovie.plot || referenceMovie.overview || "No plot available"
      }

      Movies to analyze:
      ${similarMovies
        .map(
          (movie: any, index: number) => `
          ${index + 1}.
          Title: \n${movie.title} - ${movie.genre || "N/A"}
          Plot: \n${movie.plot || movie.overview || "No plot available"}
          `
        )
        .join("\n\n")}
    `;
  }

  async function addSimilarityDescriptions(currentMovie: any, batch: any[]) {
    // Check if Groq API is available
    if (!isGroqAvailable) {
      // Return generic descriptions when Groq is not available
      return batch.map(
        () => `Similar to ${currentMovie.title} in genre and style.`
      );
    }

    // Prepare the base prompt for individual movie comparisons
    const systemPrompt = `You are a movie plot analyzing expert. 
        The user is viewing a web page that displays a movie details and similar movies. 
        You will be given:
      - The title and plot of the a reference movie (the one the page is about)
      - List of similar movies (titles and plots) to compare to the reference movie
      Your task is to generate one sentence explanation of how each movie in the list 
      is similar to the reference movie.
      Focus on:
      - Shared themes, plot elements, or character dynamics
      - Similar genres, tone, or atmosphere
      - Comparable storylines or settings
      - Emotional or narrative similarities

      Explain to the user why the movies are similar (plot, genre, tone, atmosphere, ..). 
      Keep the description to ONE sentence PER LINE. 
      Do not output anything but the sentences. Do not number nor bullet the sentences.`;

    try {
      const groq = await getGroqClient();
      const prompt = buildPrompt(currentMovie, batch);
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model: GROQ_MODELS.GEMMA2_9B,
        temperature: 0.3,
        max_tokens: 400,
      });
      const response = completion.choices[0]?.message?.content || "";
      return response
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, batch.length);
    } catch (error) {
      console.error("Error generating similarity descriptions:", error);
      // Fallback: add generic descriptions if LLM fails
      return batch.map(
        () => `Similar to ${currentMovie.title} in genre and style.`
      );
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
});
