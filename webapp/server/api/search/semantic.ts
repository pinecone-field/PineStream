import { defineEventHandler, getQuery, readBody } from "h3";
import Database from "better-sqlite3";

const db = new Database("movies.db");

export default defineEventHandler(async (event) => {
  let searchDescription: string;
  let page: number;
  let limit: number;

  if (event.method === "POST") {
    // Handle POST request with body
    const body = await readBody(event);
    console.log("POST body received:", body);
    searchDescription = body.description as string;
    page = parseInt(String(body.page)) || 1;
    limit = parseInt(String(body.limit)) || 20;
  } else {
    // Handle GET request with query params (for backward compatibility)
    const query = getQuery(event);
    console.log("GET query received:", query);
    searchDescription = query.description as string;
    page = parseInt(query.page as string) || 1;
    limit = parseInt(query.limit as string) || 20;
  }

  const offset = (page - 1) * limit;

  if (!searchDescription) {
    return {
      movies: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }

  try {
    console.log(
      "Semantic search requested with description:",
      searchDescription
    );

    // PLACEHOLDER: Return empty results until students implement semantic search

    const pc = await initPinecone();
    const index = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

    const results = await index.searchRecords({
      query: {
        inputs: { text: searchDescription },
        topK: 20,
      },
      rerank: {
        model: "bge-reranker-v2-m3",
        topN: 10,
        rankFields: ["text"],
      },
    });

    // Create a map of movie IDs to their similarity scores
    const movieScoreMap = new Map<string, number>();
    results.result.hits.forEach((match) => {
      const score = match._score || 0;
      movieScoreMap.set(match._id, score);
    });

    let movies: any[] = [];
    if (movieScoreMap.size > 0) {
      // Create placeholders for the IN clause
      const movieIds = Array.from(movieScoreMap.keys());
      const placeholders = movieIds.map(() => "?").join(",");
      const query = `SELECT * FROM movies WHERE id IN (${placeholders})`;
      movies = db.prepare(query).all(...movieIds);

      // Add similarity scores to each movie and sort by score
      movies = movies.map((movie) => {
        const score =
          movieScoreMap.get(movie.id) ||
          movieScoreMap.get(String(movie.id)) ||
          0;
        return {
          ...movie,
          similarityScore: score,
        };
      });

      // Sort movies by similarity score (highest first)
      movies.sort(
        (a, b) => (b.similarityScore || 0) - (a.similarityScore || 0)
      );
    }

    const total = results.result.hits.length;

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error in semantic search:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
