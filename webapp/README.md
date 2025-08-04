# PineStream - Movie Streaming Platform

A modern movie streaming platform built with Nuxt 3 and SQLite.

## Features

### User Profile & Watched Movies

The application now includes a comprehensive user profile system that allows users to:

- **View Profile**: Access your profile page to see your movie watching statistics
- **Mark Movies as Watched**: Add movies to your watched list from any movie page or search results
- **Remove from Watched**: Remove movies from your watched list
- **Clear All Watched**: Reset your entire watched history
- **View Statistics**: See your total watched movies, average rating, and favorite genre

### How to Use

1. **Access Profile**: Click the profile icon in the top-right corner of any page
2. **Mark Movies as Watched**:
   - On movie detail pages: Click the "Mark as Watched" button
   - On movie cards: Hover over a movie and click the eye icon
3. **Add Movies to Watched**:
   - Go to your profile page
   - Click "Add Movie to Watched"
   - Search for a movie and click to add it
4. **Remove Movies**:
   - On your profile page: Hover over a watched movie and click the X button
   - On movie detail pages: Click the "Watched" button to toggle
5. **Clear All Watched**: On your profile page, click "Clear All Watched"

### Database Schema

The application uses SQLite with the following tables:

```sql
-- Movies table (existing)
CREATE TABLE movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    overview TEXT,
    release_date TEXT,
    popularity REAL,
    vote_count INTEGER,
    vote_average REAL,
    original_language TEXT,
    genre TEXT,
    poster_url TEXT
);

-- User watched movies table (new)
CREATE TABLE user_watched_movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);
```

### API Endpoints

- `GET /api/user/watched` - Get all watched movies
- `POST /api/user/watched` - Add movie to watched list
- `DELETE /api/user/watched` - Remove movie from watched list
- `POST /api/user/clear-watched` - Clear all watched movies

### Components

- `MovieCard.vue` - Reusable movie card component with watched status
- `Header.vue` - Updated with profile navigation
- `Profile.vue` - User profile page with watched movies management

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Notes

- This is a demo application with no actual authentication
- All user data is stored locally in SQLite
- The watched movies feature works for a single user session
