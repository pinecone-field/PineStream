---
slug: recommendations
id: rhu2bqjkaxjl
type: challenge
title: Content-Based User Recommendations
teaser: This challenge teaches you how to implement content-based filtering and generate
  personalized movie recommendations based on the user's watching history
notes:
- type: text
  contents: |
    # ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!

    In this workshop, you'll add AI-powered features to a sample movie streaming platform.

    You will go through the following challenges:

    - Setup & Introduction
    - Embeddings Generation
    - User Recommendations &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#128072; ***you're here!***
    - Semantic Search Implementation
    - Query Expansion
    - Similar Movies (RAG Pipeline)
- type: text
  contents: |
    # Content-Based User Recommendations

    In this challenge, you will:
    - Understand content-based filtering and recommendation systems
    - Use vector centroids to find similar content
    - Generate personalized movie recommendations
tabs:
- id: yurr4borafky
  title: IDE
  type: service
  hostname: pinestream
  port: 8080
- id: lte2qbfm3jzd
  title: Terminal
  type: terminal
  hostname: pinestream
- id: rqevg0tqyorn
  title: PineStream
  type: service
  hostname: pinestream
  port: 3000
difficulty: intermediate
enhanced_loading: null
---

In this challenge, you will:

- Understand content-based filtering and recommendation systems
- Use vector centroids to find similar content
- Generate personalized movie recommendations

# 🧠 &nbsp; Understanding Content-Based Recommendations
===

Content-based filtering is a recommendation technique that suggests items similar to those the user has seen/liked previously. In PineStream, this means analyzing the movies a user has watched and finding other movies with similar characteristics. In technical terms, that means you need to:

1. Get the user's watching history
2. Get the dense embeddings for each movie they have watched
3. Build a centroid from those embeddings (see below)
4. Find dense vectors that are similar to the centroid
5. Find the movies that those vectors represent

## Vector Centroids
A centroid is the "average" of multiple vectors. This is best illustrated with an example.
Say a user watched 2 movies. Say we have a total of 3 chunks for them.
The centroid would then be the average of the 3 chunks:

```nocopy
// Movie chunk 1: [0.20, -0.10, 0.80, ...]
// Movie chunk 2: [0.30,  0.20, 0.60, ...]
// Movie chunk 3: [0.10, -0.30, 0.90, ...]
                    |      |     |     |
                   avg    avg   avg   avg
                    ↓      ↓     ↓     ↓
// Centroid:      [0.20, -0.07, 0.77, ...]
```

This centroid represents the user's "taste profile" calculated from the watched movies. We can then use it to find movies similar to this centroid.


# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and navigate to the home page. Notice there's no "Recommended movies" section between the hero banner and the movie grid.

Mark a few movies as watched. Alternatively, you can go to the `Profile` page to randomly select any number of films and mark them as watched. Then return to the home page - you should still see no recommendations. That's because the recommendation logic has not yet been implemented.

**You will implement it in the next steps.**

# 🚀 &nbsp; Implementing Content-Based Recommendations
===

The API that returns recommendations is in the `server/api/user/recommendations.ts` file. Open it in the [IDE tab](tab-0) and notice that it always returns an empty result. Locate the placeholder code and implement the steps.

## Step 1: Find the watched movies and their chunk IDs

Replace the `// STEP 1: Find the watched movies and their chunk IDs` placeholder with the following code:

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

Recall that when you generated the dense embeddings in the previous challenge, you also stored mappings between movie IDs and chunk IDs in the database. The code uses those mappings to get the chunk IDs of the watched movies.

## Step 2: Get the embeddings of the chunks of the watched movies

Next, you must fetch the dense embeddings for all the chunks from the Pinecone index. Replace the `// STEP 2: Get the embeddings of the chunks of the watched movies` placeholder with the following code:

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

Notice how the code uses `describeIndex` to get the dimension of the dense index. You will need it later on to build the centroid.

## Step 3: Create a centroid from the embeddings of the watched movies

With all the embeddings, you'll create a centroid (average vector) representing the user's taste profile. Replace the `// STEP 3: Create a centroid from the embeddings of the watched movies` placeholder with the following code:

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

## Step 4: Search for similar chunks using the centroid, excluding watched movies

Using the centroid, search for similar movie chunks in the dense index. Replace the `// STEP 4: Search for similar chunks using the centroid, excluding watched movies` placeholder with the following code:

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
Notice how the code uses the `movie_id: { $nin: watchedMoviesIds }` filter to exclude the chunks belonging to movies that the user has already watched.

## Step 5: Extract the highest-scoring movies from the search results

What you got from the index is chunks, not movies. For each chunk, Pinecone returns a similarity score, telling you how similar it is to the query (the centroid). You need to extract the movie IDs from the search results, keeping those with chunks with the highest similarity score. At this point, you have the movie IDs you are looking for, and you can fetch the movie details from the database.

Replace the `// STEP 5: Extract the highest scored movies from the search results` placeholder with the following code:

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

## Summary

You have now implemented a complete content-based recommendation system that:

1. **Analyzes User History**: Gets the user's watched movies and their associated chunks
2. **Creates User's Taste Profile**: Calculates a centroid vector representing the user's taste preferences
3. **Finds Similar Content**: Searches for movies similar to the user's taste profile using vector similarity
4. **Generates Recommendations**: Returns the top 10 most similar movies, excluding already watched ones

# ✅ &nbsp; Verify Your Implementations Works
===

Go to the [PineStream tab](tab-2) and navigate to the `Profile` page. Make sure you have marked at least a few movies as watched. Navigate back to the home page. You should see a "Recommended movies" section between the hero banner and the movie grid. The recommendations should reflect the types of movies you marked as watched
