## RAG

### Retrieval phase: find similar movies

- STEP 1: Prepare search text and metadata filters

```js
const plotText = currentMovie.plot || "";
const overviewText = currentMovie.overview || "";

// Combine plot and overview texts in one search query
const combinedText = [plotText, overviewText]
  .filter((text) => text.trim())
  .join(" ");

// Extract genres for metadata filtering
const currentGenres = currentMovie.genre
  ? currentMovie.genre
      .split(",")
      .map((g: string) => g.trim().toLowerCase())
      .filter((g: string) => g.length > 0)
  : [];
```

- STEP 2: Search the sparse index for similar chunks

```js
const pc = await getPineconeClient();
const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
const searchResults = await sparseIndex.searchRecords({
  query: {
    inputs: {
      text: combinedText, // Search for similarities in plot and overview
    },
    topK: 20, // Get 20 results to account for potential duplicates
    filter: {
      movie_id: { $ne: parseInt(currentMovie.id) }, // Exclude current movie
      ...(currentGenres.length > 0 && {
        genre: { $in: currentGenres }, // Filter by matching genres
      }),
    },
  },
});
```

- STEP 3: Extract the highest scored movies from the search results

```js
  const movieScoreMap = new Map<string, number>();

  // Iterate over the chunks and extract the highest score per movie
  searchResults.result.hits.forEach((hit) => {
    const movieId = (hit.fields as any).movie_id;
    const score = hit._score || 0;

    if (movieId) {
      // If the movie is already in the map, update the score if the new score is higher
      const existingScore = movieScoreMap.get(movieId) || 0;
      if (score > existingScore) {
        movieScoreMap.set(movieId, score);
      }
    }
  });
```

- STEP 4: Get the top 10 movies from the database

```js
const topMovieIds = Array.from(movieScoreMap.entries())
  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
  .slice(0, 10)
  .map(([movieId]) => parseInt(movieId));

if (topMovieIds.length === 0) {
  return [];
}

// Fetch full movie data for the top similar movies
const similarMovies = movieService.getMoviesByIds(topMovieIds, {
  includeWatched: true,
});

return similarMovies;
```

### Generation phase: ask the LLM to describe the similarity between the movies

```js
// If Groq API is not available, return generic descriptions
if (!isGroqAvailable) {
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
      Do not output anything but the sentences. 
      Do not number the sentences. Do not use bullet points.`;

try {
  const groq = await getGroqClient();
  const prompt = `
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
```
