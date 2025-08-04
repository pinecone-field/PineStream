import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const searchTerm = query.q as string;

  if (!searchTerm) {
    return {
      movies: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  // TODO: Implement search functionality
  // For now, return empty results
  return {
    movies: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  };
}); 