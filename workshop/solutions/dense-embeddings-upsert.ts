// Solution for dense-embeddings-upsert
// This replaces the placeholder in webapp/server/api/admin/generate-dense-embeddings.post.ts

//
// STEP 1: Upsert chunks into the Pinecone index
//
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

//
// STEP 2: Store the mappings of chunks to movies in the database after successful upsert
//
const chunkToMovieMappings: ChunkMapping[] = chunks.map((chunk) => ({
  id: chunk.id,
  movieId: chunk.movieId,
  chunkIndex: chunk.chunkIndex,
  totalChunks: chunk.totalChunks,
  source: chunk.source,
}));
adminService.saveChunkToMovieMappings(chunkToMovieMappings);
