# Pinecone Setup Guide

This guide will help you set up Pinecone for the Pinestream movie recommendation system.

## Prerequisites

1. **Pinecone Account**: Sign up at [https://app.pinecone.io/](https://app.pinecone.io/)
2. **API Key**: Get your API key from the Pinecone console
3. **Indexes**: Create two indexes in your Pinecone console:
   - `movies-dense` (for dense embeddings)
   - `movies-sparse` (for sparse embeddings)

## Setup Steps

### 1. Install Dependencies

The Pinecone SDK is already added to `package.json`. Install it:

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your Pinecone API key:
   ```
   PINECONE_API_KEY=your-actual-api-key-here
   ```

### 3. Create Pinecone Indexes

In your Pinecone console, create these indexes:

#### Dense Index (`movies-dense`)

- **Name**: `movies-dense`
- **Dimensions**: `1536` (for OpenAI embeddings) or `768` (for other models)
- **Metric**: `cosine`
- **Pod Type**: `p1.x1` (or your preferred type)

#### Sparse Index (`movies-sparse`)

- **Name**: `movies-sparse`
- **Dimensions**: `30000` (typical for sparse embeddings)
- **Metric**: `dotproduct`
- **Pod Type**: `p1.x1` (or your preferred type)

## Usage

### Centralized Pinecone Configuration

All Pinecone functionality is centralized in `server/utils/pinecone.ts`:

```typescript
import { getPineconeIndex, PINECONE_INDEXES } from "../utils/pinecone";

// Get an index
const denseIndex = getPineconeIndex("MOVIES_DENSE");
const sparseIndex = getPineconeIndex("MOVIES_SPARSE");
```

### Available Functions

- `initPinecone()`: Initialize Pinecone client
- `getPineconeIndex(indexName)`: Get a specific index
- `checkIndexesExist()`: Check if indexes exist
- `getIndexStats(indexName)`: Get index statistics

### Index Names

Use these constants for index names:

- `PINECONE_INDEXES.MOVIES_DENSE`: `'movies-dense'`
- `PINECONE_INDEXES.MOVIES_SPARSE`: `'movies-sparse'`

## Implementation Tasks

### 1. Admin Stats (`/api/admin/stats.ts`)

✅ **Already implemented** - Shows embedding counts from Pinecone

### 2. Generate Dense Embeddings (`/api/admin/generate-dense-embeddings.ts`)

**TODO**: Implement embedding generation and upserting to Pinecone

```typescript
// Example implementation:
for (const movie of batch) {
  // 1. Generate embedding (OpenAI, Cohere, etc.)
  const embedding = await generateEmbedding(movie.overview);

  // 2. Upsert to Pinecone
  await denseIndex.upsert([
    {
      id: movie.id.toString(),
      values: embedding,
      metadata: {
        title: movie.title,
        genre: movie.genre,
      },
    },
  ]);
}
```

### 3. Generate Sparse Embeddings (`/api/admin/generate-sparse-embeddings.ts`)

**TODO**: Implement sparse embedding generation

```typescript
// Example implementation:
for (const movie of batch) {
  // 1. Generate sparse embedding (SPLADE, BM25, etc.)
  const sparseEmbedding = await generateSparseEmbedding(movie.overview);

  // 2. Upsert to Pinecone
  await sparseIndex.upsert([
    {
      id: movie.id.toString(),
      values: sparseEmbedding,
      metadata: {
        title: movie.title,
        genre: movie.genre,
      },
    },
  ]);
}
```

### 4. Semantic Search (`/api/search/semantic.ts`)

**TODO**: Implement semantic search using dense embeddings

```typescript
// Example implementation:
// 1. Generate query embedding
const queryEmbedding = await generateEmbedding(searchDescription);

// 2. Query Pinecone
const results = await denseIndex.query({
  vector: queryEmbedding,
  topK: limit,
  includeMetadata: true,
});

// 3. Fetch movie details from database
const movieIds = results.matches.map((match) => match.id);
const movies = await fetchMoviesByIds(movieIds);
```

### 5. Similar Movies (`/api/movies/[id]/similar.ts`)

**TODO**: Implement similar movies using embeddings

```typescript
// Example implementation:
// 1. Get movie's embedding from Pinecone
const movieVector = await denseIndex.fetch([id]);

// 2. Query for similar movies
const results = await denseIndex.query({
  vector: movieVector.records[id].values,
  topK: 10,
  includeMetadata: true,
});

// 3. Fetch similar movie details
const similarMovieIds = results.matches.map((match) => match.id);
const similarMovies = await fetchMoviesByIds(similarMovieIds);
```

## Testing

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Test admin endpoints**:

   - Visit `/admin` to see stats
   - Try generating embeddings

3. **Test search**:
   - Use semantic search on the search page
   - Check similar movies on movie detail pages

## Common Issues

### API Key Not Found

- Ensure `.env` file exists and has `PINECONE_API_KEY`
- Restart the development server after changing `.env`

### Index Not Found

- Check that indexes exist in your Pinecone console
- Verify index names match: `movies-dense` and `movies-sparse`

### Dimension Mismatch

- Ensure your embedding dimensions match the index configuration
- Common dimensions: 1536 (OpenAI), 768 (BERT), 30000 (sparse)

## Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Pinecone Node.js SDK](https://docs.pinecone.io/docs/node)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Cohere Embeddings](https://docs.cohere.com/reference/embed)
