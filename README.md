# PineStream Workshop

Welcome to the code repository for the **PineStream Workshop**! This is a hands-on, instructor-led workshop where you'll **add AI-powered features to a sample movie streaming platform**. You'll learn to use Pinecone for vector search, Groq for natural language understanding, and implement modern AI patterns like RAG (Retrieval Augmented Generation).

## 🎯 What This Workshop Is

This is a **guided coding workshop** where you'll:

- **Learn by doing** - Write real code that powers a production-ready AI system
- **Build incrementally** - Start with basic embeddings and progress to advanced AI features
- **Understand the why** - Learn the theory behind vector search, embeddings, and AI patterns
- **See results immediately** - Test your implementations in a real web application

## 🎁 What's Provided (You Don't Need to Build)

### ✅ **Complete Infrastructure**

- Full Nuxt.js web application with Vue components
- Database setup with movie data
- Pinecone and Groq API integration
- Admin interface for monitoring progress
- User interface for testing features

### ✅ **Working Examples**

- Database utilities and helper functions
- Type definitions and interfaces
- Test setup and examples
- Admin interface for monitoring progress

### ✅ **Workshop Tools**

- Step-by-step solution files in `workshop/solutions/`
- Automated solution application system
- Backup and restore functionality
- Detailed workshop documentation

## 🚀 What You'll Build (The Workshop Challenges)

### **Challenge 1: Setup & Introduction**

- **Goal**: Understand the project structure and configure API keys
- **Learning**: Project structure, API keys, environment variables, application exploration
- **Key Tasks**: 
  - Set up Pinecone and Groq API keys
  - Build and run the existing application
  - Explore current functionality and identify placeholder areas

### **Challenge 2: Embeddings Generation**

- **Files**: `server/api/admin/generate-dense-embeddings.post.ts`, `server/api/admin/generate-sparse-embeddings.post.ts`
- **Goal**: Create dense and sparse embeddings for movie content
- **Learning**: Text chunking, vector generation, metadata handling, dense vs sparse embeddings
- **Key Tasks**:
  - Implement text chunking strategies for movie plots and overviews
  - Generate dense embeddings using Pinecone's integrated models
  - Generate sparse embeddings for lexical matching
  - Store embeddings with proper metadata

### **Challenge 3: User Recommendations**

- **File**: `server/api/user/recommendations.ts`
- **Goal**: Build centroid-based movie recommendations from user preferences
- **Learning**: Vector mathematics, user preference modeling, content-based filtering
- **Key Tasks**:
  - Analyze user's watched movies to extract embedding chunks
  - Calculate vector centroids representing user taste profiles
  - Find similar movies using vector similarity search
  - Rank and deduplicate recommendations

### **Challenge 4: Semantic Search Implementation**

- **File**: `server/api/search/semantic.ts`
- **Goal**: Implement hybrid search combining dense and sparse embeddings
- **Learning**: Vector similarity, hybrid search strategies, reranking
- **Key Tasks**:
  - Implement vector search using Pinecone's API
  - Combine results from dense and sparse indexes
  - Apply intelligent reranking using Pinecone's reranker
  - Support metadata filtering

### **Challenge 5: Query Expansion & Enhanced Search**

- **File**: `server/api/search/semantic.ts`
- **Goal**: Add AI-powered query understanding and intelligent filtering
- **Learning**: LLM integration, query analysis, automatic filtering
- **Key Tasks**:
  - Use Groq LLM to analyze user queries
  - Extract implicit filters (genres, time periods)
  - Generate optimized search terms for different search types
  - Provide user-friendly insights about search results

### **Challenge 6: Similar Movies & RAG Pipeline**

- **File**: `server/api/movies/[id]/similar.ts`
- **Goal**: Implement RAG pattern for finding and explaining similar movies
- **Learning**: RAG pattern, LLM integration, movie similarity analysis
- **Key Tasks**:
  - Use sparse embeddings to find similar movies
  - Implement the Retrieve → Augment → Generate pattern
  - Generate AI-powered explanations of movie similarities
  - Provide rich user insights

### **Challenge 7: Workshop Summary & Review**

- **Goal**: Review accomplishments and understand the complete system
- **Learning**: System integration, AI patterns, practical applications
- **Key Tasks**:
  - Review all implemented features
  - Understand how components work together
  - Get comprehensive reference of the codebase

## 🛠️ Workshop Setup

### Prerequisites

- Node.js 18+ installed
- pnpm package manager installed
- Pinecone and Groq API keys (provided by the instructor during workshop)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

## 📚 Workshop Resources

### **Solution Files** (`workshop/solutions/`)

- Complete implementations for each challenge
- Step-by-step comments matching workshop documentation
- Can be applied automatically using the workshop tools

### **Workshop Documentation**

- `workshop/WORKSHOP_STEPS.md` - Detailed implementation steps
- `workshop/WORKSHOP_PLAN.md` - Complete workshop overview
- `workshop/README.md` - Workshop tool usage

## 🎓 Learning Objectives

By the end of this workshop, you'll understand:

- **Vector Databases**: How to store and search high-dimensional data
- **Embeddings**: Dense vs. sparse representations and when to use each
- **AI Patterns**: Vector search, LLM integration, RAG, Query Expansion
- **Hybrid Search**: Combining multiple search strategies for better results
- **User Recommendations**: Content-based filtering using vector centroids
- **Query Understanding**: Using LLMs to enhance search capabilities

