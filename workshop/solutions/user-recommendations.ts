// Solution for user-recommendations
// This replaces the placeholder in webapp/server/api/user/recommendations.ts

//
// STEP 1: Find the watched movies and their chunk IDs
//
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

//
// STEP 2: Get the embeddings of the chunks of the watched movies
//
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

//
// STEP 3: Create a centroid from the embeddings of the watched movies
//
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

//
// STEP 4: Search for similar chunks using the centroid, excluding watched movies
//
const queryResponse = await denseIndex.query({
  vector: centroid,
  topK: 50, // Get more results since we'll deduplicate by movie
  filter: {
    movie_id: { $nin: watchedMoviesIds },
  },
  includeMetadata: true,
});

//
// STEP 5: Extract the highest scored movies from the search results
//
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
