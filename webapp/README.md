# PineStream - Workshop Sample App

A modern movie streaming platform built with Nuxt 3, designed as a starting point for workshops. This sample app provides a foundation for participants to implement advanced features like search, recommendations, and RAG (Retrieval-Augmented Generation).

## 🎯 Workshop Objectives

This sample app serves as the **starting point** for workshop participants. During the workshop, you will implement:

### 🔍 **Search Functionality**

- Implement real-time movie search
- Add search filters (genre, year, rating)
- Create search suggestions and autocomplete

### 🧠 **Recommendation System**

- Build a movie recommendation engine
- Implement collaborative filtering
- Add content-based recommendations
- Create personalized movie suggestions

### 🤖 **RAG (Retrieval-Augmented Generation)**

- Integrate with AI models for movie descriptions
- Generate personalized movie summaries
- Create AI-powered movie recommendations
- Implement conversational movie search

## 🚀 Current Features (Starting Point)

- 🎬 Browse movies with pagination
- 📱 Responsive design with Tailwind CSS
- 🗄️ SQLite database with 9,828 movies
- 📄 Individual movie pages
- 🔍 Search UI (ready for implementation)
- 🔗 Similar movies section (placeholder)

## 🛠️ Tech Stack

- **Framework**: Nuxt 3
- **Styling**: Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **Package Manager**: pnpm

## 📋 Workshop Setup

1. **Clone and Install**:

   ```bash
   pnpm install
   ```

2. **Verify Database**:

   - Ensure `movies.db` is in the project root
   - Contains 9,828 movies with full metadata

3. **Start Development Server**:

   ```bash
   pnpm dev
   ```

4. **Open Application**:
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
webapp/
├── pages/                 # Vue pages (home and movie details)
├── server/api/           # API endpoints for movies
│   ├── movies/           # Movie CRUD operations
│   └── search.ts         # Search endpoint (placeholder)
├── movies.db             # SQLite database with movie data
└── README.md            # This file
```

## 🔌 API Endpoints

### Current (Starting Point)

- `GET /api/movies` - Get all movies with pagination
- `GET /api/movies/[id]` - Get specific movie by ID
- `GET /api/search` - Search movies (placeholder)

### Workshop Implementation Targets

- `POST /api/search` - Implement real search functionality
- `GET /api/recommendations` - Build recommendation system
- `POST /api/rag` - Implement RAG features

## 🎯 Workshop Tasks

### Phase 1: Search Implementation

- [ ] Implement movie search by title
- [ ] Add genre and year filters
- [ ] Create search autocomplete
- [ ] Add search result highlighting

### Phase 2: Recommendation System

- [ ] Build content-based recommendations
- [ ] Implement collaborative filtering
- [ ] Add personalized movie suggestions
- [ ] Create recommendation algorithms

### Phase 3: RAG Integration

- [ ] Integrate with AI/LLM APIs
- [ ] Generate movie descriptions
- [ ] Create conversational search
- [ ] Implement AI-powered recommendations

## 📊 Database Schema

The `movies.db` contains the following fields:

- `id` - Unique movie identifier
- `title` - Movie title
- `overview` - Movie description
- `release_date` - Release date
- `popularity` - Popularity score
- `vote_count` - Number of votes
- `vote_average` - Average rating
- `original_language` - Original language
- `genre` - Movie genre
- `poster_url` - Movie poster image URL

## 🎨 UI Components Ready

- Netflix-style responsive layout
- Movie grid with hover effects
- Hero section with featured movie
- Search bar with dropdown
- Movie detail pages
- Pagination controls

## 🚀 Getting Started for Workshop

1. **Explore the Current App**:

   - Browse movies on the home page
   - Click on movies to see details
   - Notice the placeholder search and similar movies sections

2. **Understand the Codebase**:

   - Review the API endpoints in `/server/api/`
   - Examine the Vue components in `/pages/`
   - Check the database structure

3. **Ready for Implementation**:
   - Search functionality is ready for your code
   - Recommendation system can be built on the existing structure
   - RAG features can be integrated seamlessly

## 📝 Notes for Participants

- All placeholder features are clearly marked with "TODO" comments
- The database is pre-populated with rich movie data
- The UI is fully responsive and ready for new features
- API structure is designed to be easily extensible
- Tailwind CSS classes are used for consistent styling

---

**Happy coding! 🎬✨**
