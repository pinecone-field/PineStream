// Solution for semantic-search-vector
// This replaces the placeholder in webapp/server/api/search/semantic.ts

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
