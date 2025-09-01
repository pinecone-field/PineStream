---
slug: rag-pipeline
id: mzx3qlcop1ai
type: challenge
title: Similar Movies & RAG Pipeline
teaser: This challenge teaches you how to implement a complete RAG pipeline for finding
  and explaining similar movies using retrieval and generation
notes:
- type: text
  contents: |
    # ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!

    In this workshop, you'll add AI-powered features to a sample movie streaming platform.

    You will go through the following challenges:

    - Setup & Introduction
    - Embeddings Generation
    - User Recommendations
    - Semantic Search Implementation
    - Query Expansion & Enhanced Search
    - Similar Movies (RAG Pipeline) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#128072; ***you're here!***
- type: text
  contents: |
    # Similar Movies & RAG Pipeline

    In this challenge, you will:
    - Implement a similar movie retrieval based only on sparse search
    - Use the RAG pattern: Retrieve → Augment → Generate
    - Generate AI-powered explanations of movie similarities
tabs:
- id: qdonxtupwita
  title: IDE
  type: service
  hostname: pinestream
  port: 8080
- id: urzlrmhfcxe6
  title: Terminal
  type: terminal
  hostname: pinestream
  workdir: /app/webapp
- id: lt56pzx3ob77
  title: PineStream
  type: service
  hostname: pinestream
  port: 3000
difficulty: advanced
enhanced_loading: null
---

In this challenge, you will:

- Implement a similar movie retrieval based only on sparse search
- Use the RAG pattern: Retrieve → Augment → Generate
- Generate AI-powered explanations of movie similarities

# 🧠 &nbsp; Understanding RAG (Retrieval Augmented Generation)
===

RAG is a powerful AI pattern that combines information retrieval with text generation. You will use it in PineStream to **retrieve** similar movies, **augment** the query with the results, and then **generate** explanations of how any given movie is similar to the current one.

For this challenge, you will assume that if identical words/phrases are used in two movie plots, then the movies are alike. This will allow you to use only the sparse embeddings to find similar movies.

# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and navigate to any movie detail page. Notice that the bottom right part of the page is empty.

**You will enable the hidden "Similar Movies" section by implementing the RAG pipeline**!

# 🚀 &nbsp; Implementing the Retrieval Phase
===

Go to the [IDE tab](tab-0). Open the file `server/api/movies/[id]/similar.ts` and find the `getSimilarMovies` function. Notice that it always returns an empty result.

## Step 1: Prepare search text and metadata filters

Replace the `// STEP 1: Prepare search text and metadata filters` comment with the following code:

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

Here you are:
- getting the combined plot and overview text
- extracting the genres from a comma-separated string into an array for metadata filtering

## Step 2: Search the sparse index for similar chunks

Replace the `// STEP 2: Search the sparse index for similar chunks` comment with the following code:

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

Here you are:
- searching the sparse index in Pinecone for similar chunks
- filtering the results by genre and excluding the current movie
- getting the top 20 results to account for potential duplicates

## Step 3: Extract the highest-scoring movies from the search results

Replace the `// STEP 3: Extract the highest scored movies from the search results` comment with the following code:

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

Here you are iterating over the chunks and building a map of movie IDs and their highest scores.

## Step 4: Get the top 10 movies from the database

Finally, get the top movies from the database. Replace the `// STEP 4: Get the top 10 movies from the database` placeholder with the following code:

```ts
const topMovieIds = Array.from(movieScoreMap.entries())
  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
  .slice(0, 10)
  .map(([movieId]) => parseInt(movieId));

if (topMovieIds.length === 0) {
  return [];
}

// Fetch full movie data for the top similar movies
similarMovies = movieService.getMoviesByIds(topMovieIds, {
  includeWatched: true,
});
```


# ✅ &nbsp; Check the retrieval phase works
===

Go to the [PineStream tab](tab-2) and navigate to any movie detail page. You should now see the similar movies section populated with the top 10 similar movies.

Notice that the similarity descriptions say `Similar to {movie.title} in genre and style.` for each similar movie. While this is better than "the movie plot contains the same words as the current movie", it's not very informative.

**You will now pass the retrieved movies to an LLM and ask it to generate explanations of why the movies are similar.**


# 🚀 &nbsp; Implementing the Generation Phase
===


Here again, you will use an LLM hosted on Groq Cloud. This time, it is the `llama-3.3-70b-versatile` model, which comes with a larger context window.

In the same `server/api/movies/[id]/similar.ts` file, find the `generateSimilarityDescriptions` function. Notice how it's currently returning the generic description you saw earlier. Now paste the following code in the body of the placeholder:

```ts
// If Groq API is not available, return generic descriptions
if (!isGroqAvailable) {
  return similarMoviesWithDescriptions;
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
    model: GROQ_MODELS.LLAMA3_3_70B_VERSATILE, // which LLM to use
    temperature: 0.3,
    max_tokens: 400,
  });
  const response = completion.choices[0]?.message?.content || "";
  similarMoviesWithDescriptions = response
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, similarMovies.length);
} catch (error) {
  console.error("Error generating similarity descriptions:", error);
}
```

The code above is conceptually similar to the one you used in the previous challenge. The system message is much more concise this time. But the user prompt is huge. It contains the plots of the current movie and all the similar movies to compare to it. The LLM produces a one-sentence explanation for each film in the list, each on a new line. You then parse the response and add the explanations in the `similarMoviesWithDescriptions` array that the function returns.


## Summary

You have now implemented a complete RAG pipeline that:

1. **Retrieves Similar Content**: Uses sparse embeddings to find movies with similar plots and themes
2. **Applies Smart Filtering**: Filters by genre and excludes the current movie
3. **Ranks by Similarity**: Orders results by similarity score
4. **Generates AI Explanations**: Uses Groq LLM to explain why movies are similar
5. **Provides User Insights**: Gives users understanding of movie relationships

The system combines the power of vector similarity search with intelligent AI generation to create a rich, educational movie discovery experience.


# ✅ &nbsp; Test Your Implementation
===

Go to the [PineStream tab](tab-2) and navigate to any movie detail page. You should now see the similar movies section populated with the top 10 similar movies and proper AI-generated explanations of why they are similar.
