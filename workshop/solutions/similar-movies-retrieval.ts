// Solution for similar-movies-retrieval
// This replaces the placeholder in webapp/server/api/movies/[id]/similar.ts

//
// STEP 1: Prepare search text and metadata filters
//
const plotText = currentMovie.plot || "";
const overviewText = currentMovie.overview || "";

// Combine plot and overview texts in one search query
const combinedText = [plotText, overviewText]
  .filter((text) => text.trim())
  .join(" ");

// Extract genres for metadata filtering
const currentGenres = csvToArray(currentMovie.genre);

//
// STEP 2: Search the sparse index for similar chunks
//
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

//
// STEP 3: Extract the highest scored movies from the search results
//
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

//
// STEP 4: Get the top 10 movies from the database
//
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
