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

### **Challenge 1: Setup**

- **File**: `.env`
- **Goal**: Understand the project structure and provide own API keys
- **Learning**: Project structure, API keys, environment variables

### **Challenge 2: Dense and Sparse Embeddings**

- **File**: `server/api/admin/generate-sparse-embeddings.ts`, `server/api/admin/generate-dense-embeddings.ts`
- **Goal**: Create sparse embeddings for full movie content
- **Learning**: Text chunking, vector generation, metadata handling

### **Challenge 3: User Recommendations**

- **File**: `server/api/user/recommendations.ts`
- **Goal**: Build centroid-based movie recommendations from user preferences
- **Learning**: Vector mathematics, user preference modeling

### **Challenge 4: Vector Search**

- **File**: `server/api/search/semantic.ts`
- **Goal**: Implement similarity search using your embeddings
- **Learning**: Vector similarity, metadata filtering, search optimization

### **Challenge 5: AI-Enhanced Search**

- **File**: `server/api/search/semantic.ts`
- **Goal**: Add LLM-powered query understanding and reranking
- **Learning**: LLM integration, query analysis, hybrid search

### **Challenge 6: RAG Implementation**

- **File**: `server/api/movies/[id]/similar.ts`
- **Goal**: Implement retrieval and generation for similar movies
- **Learning**: RAG pattern, LLM integration, movie similarity

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

## 🆘 Getting Help

### **During the Workshop**

- Your instructor will guide you through each challenge
- Use the solution files if there is no other way to solve the problem

### **Workshop Tools**

- **Apply solutions**: `node workshop/solve.js [solution-id]`
- **Restore placeholders**: `node workshop/solve.js restore [solution-id]`

## 🎉 Success Criteria

You'll know you're successful when:

- ✅ Embeddings are generated and stored in Pinecone
- ✅ User recommendations work based on watched movies
- ✅ Semantic search returns relevant results
- ✅ RAG implementation generates AI-powered similarity descriptions
- ✅ You understand how all the pieces work together
