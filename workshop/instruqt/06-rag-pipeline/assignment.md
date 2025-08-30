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
    - Implement retrieval-based similar movie discovery
    - Use the RAG pattern: Retrieve → Augment → Generate
    - Generate AI-powered explanations of movie similarities
    - Learn how to combine vector search with LLM generation
    - Complete the full AI-powered movie discovery system
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

- Implement retrieval-based similar movie discovery
- Use the RAG pattern: Retrieve → Augment → Generate
- Generate AI-powered explanations of movie similarities
- Learn how to combine vector search with LLM generation
- Complete the full AI-powered movie discovery system

# 🧠 &nbsp; Understanding RAG (Retrieval Augmented Generation)
===

RAG is a powerful AI pattern that combines information retrieval with text generation. In PineStream, this means finding similar movies and then using AI to explain why they're similar in natural language.

## The RAG Pipeline

### 1. **Retrieve**
- Find relevant content using vector similarity search
- Use the sparse index to find movies with similar plots/themes
- Filter results by genre and other metadata

### 2. **Augment**
- Combine retrieved content with additional context
- Include movie details, plots, and metadata
- Prepare structured data for the LLM

### 3. **Generate**
- Use LLM to create natural language explanations
- Explain why movies are similar
- Provide insights that help users understand connections

## Why RAG is Powerful

- **Accurate Information**: Retrieval ensures factual, up-to-date content
- **Natural Explanations**: Generation provides human-like explanations
- **Contextual Understanding**: AI can explain complex relationships
- **User Experience**: Users get both results and understanding

## Example RAG Output

```nocopy
User viewing: "The Matrix" (1999)

Retrieved similar movies:
- Blade Runner (1982)
- Ghost in the Shell (1995)
- Ex Machina (2014)

AI-generated explanations:
- "Blade Runner explores similar themes of artificial intelligence and what it means to be human, with a dark, neo-noir aesthetic that influenced The Matrix's visual style."
- "Ghost in the Shell delves into consciousness and identity in a cyberpunk world, sharing The Matrix's philosophical questions about reality and existence."
- "Ex Machina examines the nature of consciousness and human-AI relationships, continuing the philosophical exploration that The Matrix began."
```

# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and navigate to any movie detail page. Notice that:

1. **Movie details** are displayed correctly
2. **Similar movies section** (bottom right) is empty or shows placeholder content
3. **No explanations** of why movies are similar
4. **No AI-generated insights** about movie relationships

**You will now implement the complete RAG pipeline**!

# 🚀 &nbsp; Implementing the RAG Pipeline
===

The RAG pipeline for similar movies is implemented in the `server/api/movies/[id]/similar.ts` file. This system finds similar movies and generates AI explanations of their similarities.

## Step 1: Implement Retrieval Phase

Go to the [IDE tab](tab-0). Open the file `server/api/movies/[id]/similar.ts` and find the `getSimilarMovies` function.

The first step is to implement the retrieval phase. Replace the `// STEP 1: Prepare search text and metadata filters` placeholder with the following code:

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

Next, implement the sparse index search. Replace the `// STEP 2: Search the sparse index for similar chunks` placeholder with the following code:

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

Now extract the highest-scoring movies. Replace the `// STEP 3: Extract the highest scored movies from the search results` placeholder with the following code:

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
const similarMovies = movieService.getMoviesByIds(topMovieIds, {
  includeWatched: true,
});

return similarMovies;
```

## Step 2: Implement Generation Phase

Now you'll implement the generation phase using Groq LLM to create explanations of movie similarities. Find the `generateSimilarityDescriptions` function and replace the `// STEP 1: Implement generation phase` placeholder with the following code:

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

## Summary

You have now implemented a complete RAG pipeline that:

1. **Retrieves Similar Content**: Uses sparse embeddings to find movies with similar plots and themes
2. **Applies Smart Filtering**: Filters by genre and excludes the current movie
3. **Ranks by Similarity**: Orders results by similarity score
4. **Generates AI Explanations**: Uses Groq LLM to explain why movies are similar
5. **Provides User Insights**: Gives users understanding of movie relationships

The system combines the power of vector similarity search with intelligent AI generation to create a rich, educational movie discovery experience.

# 🎯 &nbsp; How the RAG Pipeline Works

## The Complete RAG Flow

1. **User Views Movie**: User navigates to a movie detail page
2. **Content Analysis**: System extracts plot and overview text from the current movie
3. **Vector Search**: Searches sparse index for movies with similar content
4. **Result Processing**: Extracts top similar movies and deduplicates by score
5. **AI Generation**: LLM analyzes similarities and generates natural language explanations
6. **User Experience**: User sees similar movies with AI-generated insights

## Why This Approach Works

- **Accurate Retrieval**: Sparse embeddings excel at finding content with similar themes
- **Contextual Understanding**: LLM can explain complex thematic relationships
- **User Education**: Users learn why movies are similar, not just that they are
- **Scalable**: Works for any movie with plot/overview content

## Example RAG Output

```nocopy
Movie: "Inception" (2010)

Similar Movies Found:
1. The Matrix (1999)
2. Memento (2000)
3. Shutter Island (2010)

AI-Generated Explanations:
- "The Matrix explores similar themes of reality versus illusion, questioning what is real and what is constructed, just like Inception's dream-within-dream concept."
- "Memento shares Inception's complex narrative structure and themes of memory manipulation, though it focuses on retrograde amnesia rather than dream infiltration."
- "Shutter Island delves into psychological manipulation and the unreliability of perception, mirroring Inception's exploration of how reality can be distorted and controlled."
```

# ✅ &nbsp; Test Your Implementation
===

Go to the [PineStream tab](tab-2) and test the RAG pipeline:

1. **Navigate to movie details**: Click on any movie to view its details page
2. **Check similar movies section**: Look for the similar movies section (usually bottom right)
3. **Verify AI explanations**: Each similar movie should have an AI-generated explanation
4. **Test different movie types**: Try movies from different genres to see variety

## What to Look For

- **Relevant similar movies**: Movies should be thematically or stylistically similar
- **AI explanations**: Each similar movie should have a natural language explanation
- **Genre filtering**: Similar movies should respect genre boundaries
- **Performance**: Similar movies should load within a few seconds

## Test Different Movie Types

- **Action movies**: Should find other action films with similar themes
- **Dramas**: Should find dramas with comparable emotional or narrative elements
- **Sci-fi**: Should find other sci-fi films with similar concepts
- **Comedies**: Should find comedies with similar humor styles

## Troubleshooting

If similar movies aren't working:
1. **Check terminal logs**: Look for Pinecone or Groq API errors
2. **Verify embeddings**: Ensure you completed the embeddings challenge
3. **Check Groq API**: Verify your Groq API key is working
4. **Test with simple movies**: Try movies with clear plots and genres

# 🎉 &nbsp; Congratulations!

You've successfully implemented a complete RAG pipeline for similar movies! This system:

- **Finds relevant content** using intelligent vector search
- **Generates AI explanations** that help users understand movie relationships
- **Provides educational insights** about why movies are similar
- **Creates a rich discovery experience** that goes beyond simple recommendations

# 🏆 &nbsp; Workshop Complete!

You have now completed the entire PineStream workshop! You've built:

1. **Embeddings Generation** - Converting movie content to vectors
2. **User Recommendations** - Content-based filtering with vector centroids
3. **Semantic Search** - Vector similarity search with hybrid strategies
4. **Query Expansion** - AI-powered query analysis and enhancement
5. **RAG Pipeline** - Retrieval and generation for similar movies

## What You've Accomplished

- **Full AI-powered movie platform** with intelligent search and recommendations
- **Vector database operations** using Pinecone for similarity search
- **LLM integration** with Groq for natural language understanding
- **Hybrid search strategies** combining multiple AI approaches
- **Complete RAG implementation** for intelligent content discovery

## Real-World Applications

The skills you've learned apply to:
- **Recommendation systems** for any content platform
- **Semantic search engines** for documents, products, or media
- **AI-powered applications** that need to understand user intent
- **Content discovery platforms** that help users find relevant information

You now have the knowledge and skills to build sophisticated AI-powered applications that can understand, search, and recommend content intelligently!
