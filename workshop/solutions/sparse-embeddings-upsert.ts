// Solution for sparse-embeddings-upsert
// This replaces the placeholder in webapp/server/api/admin/generate-sparse-embeddings.post.ts

const pc = await getPineconeClient();
const index = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
await index.upsertRecords(chunks);
