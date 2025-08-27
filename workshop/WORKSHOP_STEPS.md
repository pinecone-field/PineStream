## Dense Embedding Generation

### Extract chunks from the movie's plot and overview

- STEP 1: Assert that the movie has a plot and overview

```ts
const plotText = movie.plot || "";
const overviewText = movie.overview || "";
if (!plotText.trim() && !overviewText.trim()) {
  return chunks;
}
```

- STEP 2: Create chunks from the plot text if available

```ts
if (plotText.trim()) {
  const plotChunks = await splitText(plotText);

  // Create a record for each plot chunk
  for (let chunkIndex = 0; chunkIndex < plotChunks.length; chunkIndex++) {
    const chunk = plotChunks[chunkIndex];
    const chunkId = `${movie.id}_plot_chunk_${chunkIndex}`;

    chunks.push({
      id: chunkId,
      text: chunk,
      title: movie.title || "Unknown Title",
      genre: csvToArray(movie.genre),
      movieId: movie.id,
      chunkIndex: chunkIndex,
      totalChunks: plotChunks.length,
      source: "plot",
      ...(movie.release_date && {
        release_date: dateToNumber(movie.release_date),
      }),
    });
  }
}
```

- STEP 3: Create chunks from the overview text if available

```ts
if (overviewText.trim()) {
  const overviewChunks = await splitText(overviewText);

  // Create a record for each overview chunk
  for (let chunkIndex = 0; chunkIndex < overviewChunks.length; chunkIndex++) {
    const chunk = overviewChunks[chunkIndex];
    const chunkId = `${movie.id}_overview_chunk_${chunkIndex}`;

    chunks.push({
      id: chunkId,
      text: chunk,
      title: movie.title || "Unknown Title",
      genre: csvToArray(movie.genre),
      movieId: movie.id,
      chunkIndex: chunkIndex,
      totalChunks: overviewChunks.length,
      source: "overview",
      ...(movie.release_date && {
        release_date: dateToNumber(movie.release_date),
      }),
    });
  }
}
```

### Upsert chunks into the Pinecone index

- STEP 1: Upsert chunks into the Pinecone index

```ts
// Get Pinecone client and index
const pc = await getPineconeClient();
const index = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

// Convert to Pinecone format for batch upsert
const pineconeBatch = chunks.map((chunk) => ({
  id: chunk.id,
  text: chunk.text,
  title: chunk.title,
  genre: chunk.genre,
  movie_id: chunk.movieId,
  chunk_index: chunk.chunkIndex,
  total_chunks: chunk.totalChunks,
  source: chunk.source,
  ...(chunk.releaseDate && { release_date: chunk.releaseDate }),
}));

// Upsert chunks into the Pinecone index
await index.upsertRecords(pineconeBatch);
```

- STEP 2: Store the mappings of chunks to movies in the database after successful upsert

```ts
const chunkToMovieMappings: ChunkMapping[] = chunks.map((chunk) => ({
  id: chunk.id,
  movieId: chunk.movieId,
  chunkIndex: chunk.chunkIndex,
  totalChunks: chunk.totalChunks,
  source: chunk.source,
}));
adminService.saveChunkToMovieMappings(chunkToMovieMappings);
```

## Sparse Embedding Generation

### Extract chunks from the movie's plot and overview

- STEP 1: Assert that the movie has a plot and overview

```ts
// Get both plot and overview text
const plotText = movie.plot || "";
const overviewText = movie.overview || "";
if (!plotText.trim() && !overviewText.trim()) {
  return chunks;
}
```

- STEP 2: Create chunks from the plot text if available

```ts
if (plotText.trim()) {
  chunks.push({
    id: `${movie.id}_plot`,
    text: plotText,
    title: movie.title,
    genre: csvToArray(movie.genre),
    movie_id: movie.id,
    source: "plot",
    ...(movie.release_date && {
      release_date: dateToNumber(movie.release_date),
    }),
  });
}
```

- STEP 3: Create chunks from the overview text if available

```ts
if (overviewText.trim()) {
  chunks.push({
    id: `${movie.id}_overview`,
    text: overviewText,
    title: movie.title,
    genre: csvToArray(movie.genre),
    movie_id: movie.id,
    source: "overview",
    ...(movie.release_date && {
      release_date: dateToNumber(movie.release_date),
    }),
  });
}
```

### Upsert chunks into the Pinecone index

```ts
const pc = await getPineconeClient();
const index = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
await index.upsertRecords(chunks);
```

## Recommendations

- STEP 1: Find the watched movies and their chunk IDs

```ts
// Get the chunk ids related to user's watched movies
const watchedMoviesChunks = userService.getWatchedMoviesChunks();

if (watchedMoviesChunks.length === 0) {
  return emptyRecommendations(0);
}

// Extract the movie IDs
watchedMoviesIds = [...new Set(watchedMoviesChunks.map((row) => row.movie_id))];

// Extract the chunk IDs
const chunkIds = watchedMoviesChunks
  .map((row) => row.chunk_id)
  .filter((chunkId) => chunkId !== null); // Filter out nulls from LEFT JOIN

// If no chunks found, return empty list
if (chunkIds.length === 0) {
  return emptyRecommendations(watchedMoviesIds.length);
}
```

- STEP 2: Get the embeddings of the chunks of the watched movies

```ts
const pc = await getPineconeClient();

// Get the dimension of the dense index
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

const denseIndex = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

// Fetch embeddings for all chunks of watched movies
const fetchResponse = await denseIndex.fetch(chunkIds);
const vectors = Object.values(fetchResponse.records).map(
  (record: any) => record.values
);

if (vectors.length === 0) {
  return emptyRecommendations(watchedMoviesIds.length);
}
```

- STEP 3: Create a centroid from the embeddings of the watched movies

```ts
const centroid = new Array(dimension).fill(0);

// First, sum the vectors
vectors.forEach((vector: number[]) => {
  for (let i = 0; i < dimension; i++) {
    centroid[i] += vector[i];
  }
});

// Then, divide by the number of vectors
centroid.forEach((value, index) => {
  centroid[index] = value / vectors.length;
});
```

- STEP 4: Search for similar chunks using the centroid, excluding watched movies

```ts
const queryResponse = await denseIndex.query({
  vector: centroid,
  topK: 50, // Get more results since we'll deduplicate by movie
  filter: {
    movie_id: { $nin: watchedMoviesIds },
  },
  includeMetadata: true,
});
```

- STEP 5: Extract the highest scored movies from the search results

```ts
// Extract movie IDs from recommendations and deduplicate, keeping track of scores
const movieScores = new Map<number, number>();
queryResponse.matches.forEach((match: any) => {
  const movieId = match.metadata?.movie_id;
  if (movieId && !isNaN(movieId)) {
    // Keep the highest score for each movie (in case of multiple chunks)
    const currentScore = movieScores.get(movieId) || 0;
    if (match.score > currentScore) {
      movieScores.set(movieId, match.score);
    }
  }
});

// Sort movies by score (highest first) and take top 10
const topMovieIds = Array.from(movieScores.entries())
  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
  .slice(0, 10)
  .map(([movieId]) => movieId);

// Fetch movie details from the database
if (topMovieIds.length > 0) {
  recommendations = movieService.getMoviesByIds(topMovieIds);
}
```

## Semantic Hybrid Search

### Vector search

```ts
// Build the search options for Pinecone
const searchOptions: any = {
  query: {
    inputs: { text: searchText },
    topK: limit,
  },
};

// Add the metadata filter if it exists
if (Object.keys(metadataFilter).length > 0) {
  searchOptions.filter = metadataFilter;
}

// Perform the vector search
const pc = await getPineconeClient();
const index = pc.index(indexName);
const results = await index.searchRecords(searchOptions);

// Extract movie IDs from the results
results.result.hits.forEach((hit) => {
  const movieId = (hit as any).fields?.movie_id;
  if (movieId) {
    movieIds.add(movieId);
  }
});
```

### Reranking

```ts
// Fetch movie plots from database for reranking
const movieIdsArray = Array.from(movieIds);
const movies = movieService.getMoviesByIds(movieIdsArray);

// Prepare the texts to rerank
const texts = movies.map((movie) => {
  // Use plot if available, otherwise fallback to overview
  const text = movie.plot || movie.overview || movie.title || "";
  return {
    id: String(movie.id), // Convert to string for reranker
    text: text,
  };
});

// Rerank movies using Pinecone reranker
const pc = await getPineconeClient();
const rerankResults = await pc.inference.rerank(
  "bge-reranker-v2-m3", // which model to use
  searchText, // what user asked
  texts, // the objects to rerank
  {
    topN: limit,
    rankFields: ["text"], // the field to rank by
    returnDocuments: true, // whether to return the documents
  }
);

// The reranker returns results sorted by score (highest first)
// We can directly map the results to our movies and add scores
highestRankedMovies = rerankResults.data
  .map((doc) => {
    const movieId = doc.document?.id;
    const movie = movies.find((m) => String(m.id) === movieId);

    if (movie) {
      return {
        ...movie,
        similarityScore: doc.score || 0,
      };
    }
    return null;
  })
  .filter(Boolean); // Remove any null entries
```

## GAR (Generation Augmented Retrieval)

### Generation phase: ask the LLM to get insides about the query

```ts
// prepare the system prompt for the LLM
const systemPrompt = `You are a movie query analyzer.
Extract filters and optimized queries. Return ONLY JSON:

{
  "genres": ["genre1","genre2"] or null,
  "dateRange": {"start": "YYYY-MM-DD" or null, "end": "YYYY-MM-DD" or null},
  "denseQuery": "semantic reformulation for vector search",
  "sparseQuery": "keyword-style reformulation for lexical search",
  "userMessage": "Based on your request, we filtered movies by ...",
  "hasFilters": true or false
}

Rules:
- Genres: only from → action, comedy, drama, horror, sci-fi, romance, thriller, documentary, animation, fantasy, adventure, crime, mystery, western, musical, war, family, history, biography, sport. Lowercase. Null if none.

- Dates: Extract ONLY if the user explicitly mentions a time period (decade, year, range, "before/after", "recent").
  • If no explicit time reference is present, set dateRange = {"start": null, "end": null}.
  • Examples:
    - "90s" → 1990-1999
    - "2020" → 2020-2020
    - "1995 to 2000" → 1995-2000
    - "before 2000" → 1900-1999
    - "recent" → 2020-2024

- Dense query: semantic, natural, theme/plot-based.
- Sparse query: keywords, entities, compact. Drop stopwords.
- If query = only filters → denseQuery = "movies", sparseQuery = "film movie".

- userMessage format:
  • Genres + dates → "Based on your request, we filtered movies by \`{genres list}\` genres released in the \`YYYY - YYYY\` time period."
  • Only genres → "Based on your request, we filtered movies by \`{genres list}\` genres."
  • Only dates → "Based on your request, we filtered movies released in the \`YYYY - YYYY\` time period."
  • No filters → null.

Example output with both genres & dates:
{
  "genres": ["drama","sci-fi","thriller"],
  "dateRange": {"start":"1990-01-01","end":"2004-12-31"},
  "denseQuery": "dramatic and suspenseful science fiction thrillers",
  "sparseQuery": "drama sci-fi thriller movie",
  "userMessage": "Based on your request, we filtered movies by \`drama\`, \`sci-fi\`, and \`thriller\` genres released in the \`1990 - 2004\` time period.",
  "hasFilters": true
}

Example output with only genre:
{
  "genres": ["sci-fi"],
  "dateRange": {"start": null, "end": null},
  "denseQuery": "science fiction movies about space exploration",
  "sparseQuery": "sci-fi space exploration movie",
  "userMessage": "Based on your request, we filtered movies by \`sci-fi\` genres.",
  "hasFilters": true
}
`;

try {
  // Call the LLM via Groq API to get the insight
  const groq = await getGroqClient();
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: searchQuery },
    ],
    model: GROQ_MODELS.LLAMA3_1_8B_INSTANT, // which LLM to use
    temperature: 0.1, // Low temperature for consistent parsing
    max_tokens: 300, // max tokens to generate
  });

  // get the response from the LLM
  const response = completion.choices[0]?.message?.content || "{}";

  // Extract JSON from the response (in case it includes explanatory text)
  const jsonString = extractJSONFromResponse(response);
  const parsedInsight = JSON.parse(jsonString) as SearchInsight;

  // construct the insight object
  insight = {
    genres: parsedInsight.genres || undefined,
    dateRange: parsedInsight.dateRange || undefined,
    hasFilters: parsedInsight.hasFilters || false,
    userMessage:
      parsedInsight.userMessage || "We found movies matching your description.",
    denseQuery: parsedInsight.denseQuery || searchQuery,
    sparseQuery: parsedInsight.sparseQuery || searchQuery,
  };
} catch (error) {
  console.error("Error analyzing search query:", error);
}
```

## RAG

### Retrieval phase: find similar movies

- STEP 1: Prepare search text and metadata filters

```ts
const plotText = currentMovie.plot || "";
const overviewText = currentMovie.overview || "";

// Combine plot and overview texts in one search query
const combinedText = [plotText, overviewText]
  .filter((text) => text.trim())
  .join(" ");

// Extract genres for metadata filtering
const currentGenres = csvToArray(currentMovie.genre);
```

- STEP 2: Search the sparse index for similar chunks

```ts
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

```ts
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

```ts
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

```ts
// If Groq API is not available, return generic descriptions
if (!isGroqAvailable) {
  return similarMovies.map(
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
      Reference Movie: \n${currentMovie.title}
      Plot: \n${
        currentMovie.plot || currentMovie.overview || "No plot available"
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
    model: GROQ_MODELS.LLAMA3_1_8B_INSTANT, // which LLM to use
    temperature: 0.3,
    max_tokens: 400,
  });
  const response = completion.choices[0]?.message?.content || "";
  return response
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, similarMovies.length);
} catch (error) {
  console.error("Error generating similarity descriptions:", error);
  // Fallback: add generic descriptions if LLM fails
  return similarMovies.map(
    () => `Similar to ${currentMovie.title} in genre and style.`
  );
}
```
