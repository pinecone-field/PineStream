# PineStream - AI-Powered Movie Recommendation Workshop

Welcome to the PineStream workshop! This is a hands-on workshop where you'll build an AI-powered movie recommendation system using Pinecone for vector search and Groq for natural language understanding.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- pnpm package manager installed
- Pinecone and Groq API keys (provided during workshop)

### Setup & Run

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

## 📁 Project Structure

### Key Directories

```
webapp/
├── server/api/           # Backend API endpoints
├── components/           # Vue components
├── pages/               # Application pages
├── stores/              # State management
└── test/                # Test files
```

### Main Files You'll Work With

- `server/api/admin/generate-dense-embeddings.ts` - Generate dense embeddings
- `server/api/admin/generate-sparse-embeddings.ts` - Generate sparse embeddings
- `server/api/user/recommendations.ts` - User movie recommendations
- `server/api/search/semantic.ts` - Semantic search functionality
- `server/api/movies/[id]/similar.ts` - Similar movies (✅ Already implemented)

## 🎯 Workshop Challenges

### Challenge 1: Environment Setup ✅

- **Status**: Already complete
- **What**: Pinecone and Groq configured, database ready

### Challenge 2: Dense Embeddings

- **File**: `server/api/admin/generate-dense-embeddings.ts`
- **Goal**: Generate and store dense embeddings for movie plots

### Challenge 3: Sparse Embeddings

- **File**: `server/api/admin/generate-sparse-embeddings.ts`
- **Goal**: Generate and store sparse embeddings for full movies

### Challenge 4: User Recommendations

- **File**: `server/api/user/recommendations.ts`
- **Goal**: Build centroid-based movie recommendations

### Challenge 5: Basic Search

- **File**: `server/api/search/semantic.ts`
- **Goal**: Implement vector similarity search

### Challenge 6: LLM-Enhanced Search

- **File**: `server/api/search/semantic.ts`
- **Goal**: Add Groq-powered query understanding

### Challenge 7: RAG Implementation ✅

- **File**: `server/api/movies/[id]/similar.ts`
- **Status**: Already complete - working similar movies with AI descriptions

## 🧪 Testing Your Work

### Admin Interface

- Visit `/admin` to test embedding generation
- Monitor progress and check for errors

### Search & Discovery

- Use `/search/semantic` to test search functionality
- Try natural language queries like "action movies from the 90s"

### Movie Recommendations

- Visit `/profile` to see user recommendations
- Mark movies as watched to build your preference profile

### Similar Movies

- Visit any movie detail page (e.g., `/movie/1`)
- See AI-generated similarity descriptions

## 🔧 Development Commands

```bash
# Run tests
pnpm test:run

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📚 What You'll Learn

- **Vector Databases**: Store and search movie embeddings
- **Embeddings**: Dense vs. sparse vector representations
- **Hybrid Search**: Combine vector similarity with metadata filtering
- **LLM Integration**: Use Groq for natural language understanding
- **RAG Pattern**: Retrieval Augmented Generation for movie recommendations

## 🆘 Getting Help

- Check the `WORKSHOP_PLAN.md` for detailed challenge instructions
- Look at the working RAG implementation in `similar.ts` for reference
- Use the admin interface to monitor your progress
- Ask your workshop instructor for guidance

## 🎉 Success Criteria

Your workshop is complete when:

- ✅ Embeddings are generated and stored in Pinecone
- ✅ User recommendations work based on watched movies
- ✅ Semantic search returns relevant results
- ✅ LLM-enhanced search understands natural language queries
- ✅ Similar movies show AI-generated descriptions

---

**Good luck with your workshop! You're building a production-ready AI recommendation system! 🚀**
