// Solution for semantic-search-rerank
// This replaces the placeholder in webapp/server/api/search/semantic.ts

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
