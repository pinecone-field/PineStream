# Search Implementation Guide

## Current Implementation

### Token-Based Search

The basic search functionality is now implemented and working. It searches across:

- **Title**: Movie titles
- **Overview**: Movie descriptions
- **Genre**: Movie genres

The search uses SQL LIKE queries with wildcards (`%searchterm%`) to find partial matches.

### Semantic Search (To Be Implemented)

The semantic search endpoint is set up at `/api/search/semantic` but needs implementation by workshop participants.

## Files Modified/Created

1. **`/server/api/search.ts`** - Token-based search implementation
2. **`/server/api/search/semantic.ts`** - Semantic search endpoint (placeholder)
3. **`/components/Header.vue`** - Search UI with toggle between modes
4. **`/pages/search.vue`** - Dedicated search results page
5. **`SEARCH_IMPLEMENTATION.md`** - This documentation

## Testing the Implementation

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Test token search:**

   - Type movie titles, genres, or keywords
   - Search should work immediately

3. **Test semantic search:**
   - Click the ✨ button to switch to semantic search
   - Type descriptions like "movies about space exploration" or "romantic comedies"
   - Implement the semantic search functionality

## UI Features

- **Search Toggle**: Click the 🔍/✨ button to switch between search modes
- **Debounced Search**: 300ms delay to avoid excessive API calls
- **Search Results**: Dropdown with movie previews
- **Full Results Page**: Click "View All Results" for paginated results
- **Search Type Indicator**: Shows which search mode is active

## Database Schema

The movies table has these searchable fields:

- `title` (TEXT)
- `overview` (TEXT)
- `genre` (TEXT)

For semantic search, focus on the `overview` field as it contains the most descriptive content.
