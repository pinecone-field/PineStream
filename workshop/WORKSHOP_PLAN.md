# PineStream Workshop Plan

## Overview

This workshop follows one comprehensive track that enhances an existing movie streaming platform (PineStream) with AI-powered features step by step. Each exercise builds upon the previous one, adding new capabilities to create a fully functional AI-enhanced application.

## Prerequisites

- Basic JavaScript/TypeScript knowledge
- Understanding of APIs and HTTP requests

## Workshop Structure

### **Exercise 1: Setup & Introduction**

- Show PineStream - build, run, demonstrate features
- Explain the workshop structure and the placeholder system
- Demonstrate the working application
- Get API keys (Pinecone and Groq) and create `.env` file

**Files**: `.env`

**Duration**: 15 minutes

### **Exercise 2: Embedding Fundamentals & Generation**

- Explain dense vs sparse embeddings and their differences
- **Dense Embeddings**:
  - Extract chunks from movie plots/overviews (`dense-embeddings-extract`)
  - Explain chunking strategies for text processing
  - Upsert chunks to Pinecone index (`dense-embeddings-upsert`)
- **Sparse Embeddings**:
  - Extract chunks from movie plots/overviews (`sparse-embeddings-extract`)
  - Upsert chunks to Pinecone index (`sparse-embeddings-upsert`)

**Files**:

- `server/api/admin/generate-dense-embeddings.post.ts`
- `server/api/admin/generate-sparse-embeddings.post.ts`

**Duration**: 45 minutes

### **Exercise 3: Content-Based User Recommendations**

- Implement content-based filtering based on user's own watching history
- Use watched movie embeddings to create a centroid
- Find similar content that matches the user's personal taste

**Files**: `server/api/user/recommendations.ts`

**Duration**: 30 minutes

### **Exercise 4: Semantic Search Implementation**

- **Vector Search**: Implement dense and sparse vector similarity search (`semantic-search-vector`)
- **Hybrid Search**: Combine dense and sparse search results
- **Reranking**: Implement semantic reranking of results (`semantic-search-rerank`)

**Files**: `server/api/search/semantic.ts`

**Duration**: 45 minutes

### **Exercise 5: Query Expansion & Enhanced Search**

- **Insight Generation**: Add AI-generated insights to search results (`semantic-search-insight`)
- Explain **Query Expansion** - how AI can enhance and expand user queries

**Files**: `server/api/search/semantic.ts`

**Duration**: 30 minutes

### **Exercise 6: Similar Movies & RAG Pipeline**

- **Retrieval**: Implement sparse index search for similar movies (`similar-movies-retrieval`)
- **Generation**: Use LLM to create similarity descriptions (`similar-movies-generation`)
- Demonstrate complete RAG pipeline: Retrieve → Augment → Generate

**Files**: `server/api/movies/[id]/similar.ts`

**Duration**: 30 minutes

## Implementation Details

### **Files to Modify**

1. `server/api/admin/generate-dense-embeddings.post.ts`
2. `server/api/admin/generate-sparse-embeddings.post.ts`
3. `server/api/user/recommendations.ts`
4. `server/api/search/semantic.ts`
5. `server/api/movies/[id]/similar.ts`

### **Key Functions to Implement**

- `index.upsertRecords()` calls
- Vector similarity calculations
- Centroid computation for user profiles
- LLM query analysis and expansion
- Result ranking and filtering

### **Where to see the results of the implementations**

1. **eEmbedding generation**: The `/admin` page allows you to generate dense and sparse embeddings for the movies
2. **Recommendations**: Displayed on the home page under the hero banner. User profile page allows to generate watched movies history.
3. **Search**: Use semantic search options in the search bar
4. **Similar Movies**: Displayed on the bottom right of the movie detail pages

## Learning Outcomes

### **Technical Skills**

- Vector database operations with Pinecone
- Embedding generation and storage
- Hybrid search strategies (dense + sparse)
- LLM integration patterns (with Groq)

### **AI/ML Concepts**

- Dense vs. Sparse embeddings
- Vector similarity and centroids
- Query Expansion and LLM-enhanced search
- Retrieval Augmented Generation (RAG)
- Content-based filtering strategies

### **Real-World Applications**

- Recommendation systems
- Semantic search engines
- Content discovery platforms
- AI-powered applications

## Common Challenges (partially implemented but not discussed in the workshop)

### **Rate Limiting**

- Implement exponential backoff
- Use batch processing
- Add delays between requests

### **Error Handling**

- Graceful fallbacks for API failures
- Retry mechanisms
- User-friendly error messages

### **Performance**

- Optimize batch sizes
- Use parallel processing where possible
- Implement caching strategies
