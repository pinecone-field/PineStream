---
slug: embeddings
id: 1dol09tt0gjx
type: challenge
title: Generating embeddings
teaser: This challenge teaches you about dense vs sparse embeddings and how to generate
 them for movie content
notes:
- type: text
  contents: |
    # ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!

   In this workshop, you'll add AI-powered features to a sample movie streaming platform.

   You will go through the following challenges:

   - Setup & Introduction
   - Embeddings Generation &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#128072; ***you're here!***
   - User Recommendations
   - Semantic Search Implementation
   - Query Expansion
   - Similar Movies (RAG Pipeline)
- type: text
  contents: |
    # Embedding Fundamentals & Generation

    In this challenge, you will:
    - Understand the difference between **dense** and **sparse** embeddings
    - Implement text chunking strategies for movie content
    - Generate and store dense embeddings in Pinecone
    - Generate and store sparse embeddings in Pinecone
    - Learn how these embeddings enable semantic search and recommendations
tabs:
- id: wbizcxvzoise
  title: IDE
  type: service
  hostname: pinestream
  port: 8080
- id: xgvbkgp194vh
  title: Terminal
  type: terminal
  hostname: pinestream
  workdir: /app/webapp
- id: cx2ceo7czqnw
  title: PineStream
  type: service
  hostname: pinestream
  port: 3000
difficulty: intermediate
enhanced_loading: null
---

In this challenge, you will:

- Understand the difference between dense and sparse embeddings
- Implement text chunking strategies for movie content
- Generate and store dense embeddings in Pinecone
- Generate and store sparse embeddings in Pinecone
- Learn how these embeddings enable semantic search and recommendations

# 🧠 &nbsp; Understanding Embeddings
===

The PineStream application has a lot of unstructured data about movies. You are expected to implement features that "understand" the data perform operations on it. In order to do that, you need to convert the data into a format that can be used by algorithms and AI models - embeddings.

## Dense Embeddings

Dense Embeddings (also called semantic embeddings) are numerical representations of unstructured data (text, images, audio, etc.) that capture its semantic or lexical (for text) meaning. Think of them as a way to convert objects into math that computers can understand and compare. In mathematical terms, those are high-dimensional vectors (a list of numbers).

Their weights (the numbers):

- Capture semantic meaning and context
- Represent an "understanding of what the object is"
- Can be used for comparing and finding similar objects

Here is what a dense embedding looks like:
```nocopy
 [0.23, -0.45, 0.12, 0.89, -0.34, 0.67, 0.01, -0.78, ...]
   ↑      ↑     ↑     ↑      ↑     ↑     ↑      ↑     ↑
 Each dimension has a a value representing some semantic
 concept like "mood", "theme", "genre", etc.
```

## Sparse Embeddings

Sparse Embeddings (also called lexical embeddings) are numerical representations of a text that capture its lexical meaning. Think of them as a way to map a text to a dictionary of words or phrases. They are also vectors of numbers but of much higher dimension (tens of thousands) than dense embeddings and mostly filled with zeros.

Their weights (the numbers):
- Track occurrences of specific words/phrases in a text
- Allow for exact keyword / phrase matching

Here is what a sparse embedding looks like:
```nocopy
 [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...]
           ↑
 Only specific word positions have values (usually 1 or 0)
 Most positions are 0, making it "sparse"
```

## How Are Embeddings Generated?

Conceptually, converting unstructured data to embeddings involves two steps:

1. The data needs to be cleaned, normalized, and prepared for use by an embedding model.
2. An embedding model analyzes the data and converts it into a numerical representation (embeddings).

**Because you will be using Pinecone, to store the vectors, you don't need to implement the second step.** Pinecone has built-in embedding models that can automatically generate embeddings from text.

You still need to take care of the first step - data preprocessing. And a big of that is chunking the texts into smaller pieces.

# 📝 &nbsp; Text Chunking
===

The size of the text being embedded significantly impacts how well the embeddings capture meaning.

- **Too small chunks**: May lose context and produce fragmented, less meaningful embeddings
- **Too large chunks**: May exceed embedding model limits and dilute the focus on specific themes
- **Overlapping chunks**: Help maintain context between chunks by sharing some content, ensuring narrative continuity

> [!NOTE]
> Data preprocessing is not a trivial task. It requires research and testing to find the best approach for the specific use case. In the `test` directory you can find **sample** tests and AI generated analysis of the results. Keep in mind those are for illustration purposes only. Consult with data scientists and domain experts to find the best approach for your real projects.

# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and click the `Admin` button in the header.
The `Generate Dense Embeddings` and `Generate Sparse Embeddings` buttons should be active. Click them and notice how they finish quickly and create 0 embeddings. That is because the logic for generating embeddings is not implemented yet.

**You will now implement them**!


# 🚀 &nbsp; Implementing Dense Embeddings
===

Functionalities like semantic search and recommendations need to find and compare unstructured content (movie plots and overviews). To do so, you need dense embeddings for those texts that capture the meaning of the content.


## Extract chunks from the movie's plot and overview

Go to the [IDE tab](tab-0). Open the file `server/api/admin/generate-dense-embeddings.post.ts` and find the `extractChunksForMovie` function.

### Step 1: Extract the plot and overview text

The caller passed a movie object to the function. The first thing you need to do is to extract the plot and overview text from the movie object. To do so, replace the `// STEP 1: Assert that the movie has a plot and overview` placeholder with the following code:

```ts
// Assert that the movie has a plot and overview
const plotText = movie.plot || "";
const overviewText = movie.overview || "";
if (!plotText.trim() && !overviewText.trim()) {
  return chunks;
}
```

### Step 2: Create chunks from the plot text if available

Next you need to split the plot text into chunks. Replace the `// STEP 2: Create chunks from the plot text if available` placeholder with the following code:

```ts
// Create chunks from the plot text if available
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

> [!NOTE]
> Note the `splitText` function. It is a utility function that splits the text into chunks. It uses the  LangChain's `RecursiveCharacterTextSplitter` our tests found to be the best for movie plots. The function is defined in the `server/utils/text-splitter.ts` file.


### Step 3: Create chunks from the overview text if available

The you need to do the same for the overview text. Replace the `// STEP 3: Create chunks from the overview text if available` placeholder with the following code:

```ts
// Create chunks from the overview text if available
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

### Summary

You have now implemented the logic for creating chunks for dense embeddings from the plot and overview text. Each chunk is a string of text that is a part of the movie's plot or overview. Each chunk has the following metadata:

- `id`: A unique identifier for the chunk
- `text`: The text of the chunk
- `title`: The title of the movie
- `genre`: The genres of the movie (and array of strings)
- `movieId`: The ID of the movie
- `chunkIndex`: The index of the chunk in the movie's plot or overview
- `totalChunks`: The total number of chunks in the movie's plot or overview
- `source`: The source of the chunk (either "plot" or "overview")
- `release_date`: The release date of the movie (if available)


## Store the chunks

Now that you have the prepared the data, you need to store it. You will use Pinecone to convert the chunks into vectors and store them in the dense index. You will also store the chunk-to-movie mappings in the database so you can later use them to retrieve the chunks for a given movie.

In the same file, find the `upsertChunksToPinecone` function. The application calls this function passing a array of chunks and expects it to properly upsert the chunks into the Pinecone index.

### Step 1: Upsert chunks into the Pinecone index

Replace the `// STEP 1: Upsert chunks into the Pinecone index` placeholder with the following code:

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
> [!NOTE]
> Note the `getPineconeClient` function. It is a utility function that gets properly configured Pinecone client (using the `PINECONE_API_KEY` environment variable). The function is defined in the `server/utils/pinecone.ts` file. The `pc` object is part of Pinecone's API documented in the [Pinecone Typescript SDK documentation](https://sdk.pinecone.io/typescript/classes/Pinecone.html).


### Step 2: Store the chunk-to-movie mappings in the database

Replace the `// STEP 2: Store the mappings of chunks to movies in the database` placeholder with the following code:

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

## Summary

You have now implemented the logic for storing the chunks in the Pinecone index and their mappings to the movies in the database.

> [!IMPORTANT]
> Note that you didn't have to implement the logic for generating the embeddings. You passed the chunks as texts to Pinecone and it generated the embeddings for you. This is due to how the index was configured. You can have a look at the `ensureIndexesExist` function in the `server/utils/pinecone.ts` file to see how it tells Pinecone to use the `multilingual-e5-large` model for dense embeddings. For more information on how to configure the index, see the [Pinecone documentation](https://docs.pinecone.io/guides/index-data/indexing-overview#integrated-embedding).

# 🔍 &nbsp; Implementing Sparse Embeddings
===

Often pieces of the unstructured data do not have semantic meaning but their lexical meaning is important (think of names, terms, places, dates, etc.). To be able to find and compare such content, you need to generate sparse embeddings for them.

## Extract chunks from the movie's plot and overview

Since dense embeddings don't extract meaning but track words/phrases occurrences, the size of the chunks is not important _(as long as it fits in the model's context window)_. So you will create only two sparse chunks per movie - one for the plot and one for the overview.

Go to the [IDE tab](tab-0). Open the file `server/api/admin/generate-sparse-embeddings.post.ts` and find the `extractChunksForMovie` function.

### Step 1: Validate Movie Content

The caller passes a movie object to the function. The first thing you need to do is to extract the plot and overview text from the movie object. To do so, replace the `// STEP 1: Assert that the movie has a plot and overview` placeholder with the following code:

```ts
// Get both plot and overview text
const plotText = movie.plot || "";
const overviewText = movie.overview || "";
if (!plotText.trim() && !overviewText.trim()) {
  return chunks;
}
```

### Step 2: Create chunks from the plot text if available

Replace the `// STEP 2: Create chunks from the plot text if available` placeholder with the following code:

```ts
// Create chunks from the plot text if available
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

### Step 3: Create chunks from the overview text if available


Replace the `// STEP 3: Create chunks from the overview text if available` placeholder with the following code:

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

### Summary

You have now implemented the logic for creating chunks for sparse embeddings from the plot and overview text. Each chunk has the following metadata:

- `id`: A movie ID and a source of the chunk (either "plot" or "overview")
- `text`: The text of the chunk
- `title`: The title of the movie
- `genre`: The genres of the movie (an array of strings)
- `movieId`: The ID of the movie
- `release_date`: The release date of the movie (if available)
- `source`: The source of the chunk (either "plot" or "overview")

## Store the chunks

Now that you have the prepared the data, you need to store it. You will use Pinecone again to convert the chunks into sparse vectors and store them in the sparse index.

In the same file, find the `upsertChunksToPinecone` function. The application calls this function passing a array of chunks and expects it to properly upsert the chunks into the Pinecone index.

Place the following code in the body of the placeholder:

```ts
const pc = await getPineconeClient();
const index = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
await index.upsertRecords(chunks);
```

That's it! You have now implemented the logic for creating and storing sparse embeddings for movie plots and overviews.

> [!IMPORTANT]
> Here again, you didn't have to implement the logic for generating the embeddings. You passed the chunks as texts to Pinecone and it generated the sparse embeddings for you. This is due to how the index was configured. You can have a look at the `ensureIndexesExist` function in the `server/utils/pinecone.ts` file to see how it tells Pinecone to use the `pinecone-sparse-english-v0` model for sparse embeddings. For more information on how to configure the index, see the [Pinecone documentation](https://docs.pinecone.io/guides/index-data/indexing-overview#integrated-embedding).


# ✅ &nbsp; Check Your Implementations
===

Go to the [PineStream tab](tab-2) and click the `Admin` button in the header.

Click the `Generate Dense Embeddings` and `Generate Sparse Embeddings` buttons and they should now display a progress bar telling you how many movies are being processed. Depending on the size of the database, this may take a few minutes to complete.

Once the upsert processes complete, the `Dense Embeddings` and `Sparse Embeddings` meters in the `Database Statistics` panel should be updated to show the number of respective embeddings. If you used `movies_small.db`, you should see
 - about 2000 dense embeddings - on average 3 per plot and 1 per overview per movie
 - 1000 sparse embeddings - two per movie - one for the plot and one for the overview.

Go to [Pinecone Console](https://app.pinecone.io/) and check both indexes. Confirm that the number of vectors in each index matches what you see in the `Database Statistics` panel.
