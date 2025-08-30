---
slug: semantic-search
id: jozp4fykc8yk
type: challenge
title: Semantic Search Implementation
teaser: This challenge teaches you how to implement semantic search using vector similarity,
  hybrid search strategies, and intelligent reranking
notes:
- type: text
  contents: |
    # ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!

    In this workshop, you'll add AI-powered features to a sample movie streaming platform.

    You will go through the following challenges:

    - Setup & Introduction
    - Embeddings Generation
    - User Recommendations
    - Semantic Search Implementation &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#128072; ***you're here!***
    - Query Expansion
    - Similar Movies (RAG Pipeline)
- type: text
  contents: |
    # Semantic Search Implementation

    In this challenge, you will:
    - Implement vector similarity search using dense and sparse embeddings
    - Implement hybrid search combining the dense and sparse results
    - Add intelligent re-ranking using Pinecone's reranker
tabs:
- id: rmo5j8ivorr4
  title: IDE
  type: service
  hostname: pinestream
  port: 8080
- id: lmqwlpt1v93q
  title: Terminal
  type: terminal
  hostname: pinestream
  workdir: /app/webapp
- id: 5zcph4nykmlk
  title: PineStream
  type: service
  hostname: pinestream
  port: 3000
difficulty: intermediate
enhanced_loading: null
---

  In this challenge, you will:
  - Implement vector similarity search using dense and sparse embeddings
  - Implement hybrid search combining the dense and sparse results
  - Add intelligent re-ranking using Pinecone's reranker

# 🧠 &nbsp; Understanding Hybrid Search
===

You already implemented semantic search using dense embeddings in the previous challenge by searching the vectors similar to the centroid. In this challenge, you will go a step further and implement hybrid search combining the dense and sparse results.

In a nutshell, the hybrid search process consists of the following steps:
- performing a dense vector search (semantic similarity)
- performing a sparse vector search (lexical similarity)
- combining the results and deduplicating them
- re-ranking the results

# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and try using the semantic search functionality (✨ icon in the search bar). You can use any of the example queries it provides or write your own. Notice that it does not return any results. That's because the semantic search functionality has not been implemented yet.

**You will now implement it**!

# 🚀 &nbsp; Implementing Vector Search
===

The PineStream's semantic search API is implemented in the `server/api/search/semantic.ts` file. Open it in the [IDE tab](tab-0) and find the `doVectorSearch` function.

> [!IMPORTANT]
> The reason there is a single function is that Pinecone's API for vector search is independent of the index type (dense/sparse). When you send a query targeting a given Pinecone index, it knows the index type and uses the appropriate vector search method.

Notice, the function has several arguments - the search text, the limit, the metadata filter, and **the index name**. The endpoint calls this function twice - once for the dense index and once for the sparse index.

To implement it, paste the following code in the body of the placeholder:

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

That's it! The function now returns the movie IDs that match the search query.

# 🚀 &nbsp; Implement Re-ranking
===

After calling the above function twice, the endpoint has two lists of movie IDs that match the search query. It deduplicates them but it has no way of knowing which results are more relevant to the query. While both dense and sparse results have similarity scores, the two types are not directly comparable. Thus the endpoint needs to call a function that will re-rank the results.

In the same file find the `getHighestRankedMovies`. Notice how it receives the movie IDs, the search text, and the limit. You will now implement it so it returns the top `limit` movies that are most relevant to the search query. Paste the following code in the body of the placeholder:

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

Your re-ranking implementation:
1. **Fetches movie data** from the database for the search results
2. **Prepares text content** for re-ranking (plot, overview, or title)
3. **Uses Pinecone's re-ranker** to score and reorder results
4. **Maps results back** to movie objects with similarity scores

# ✅ &nbsp; Test Your Implementation
===

Go to the [PineStream tab](tab-2) and try using the semantic search functionality again (✨ icon in the search bar). You can use any of the example queries it provides or write your own.It should return the top 20 movies that are most relevant to the query.
