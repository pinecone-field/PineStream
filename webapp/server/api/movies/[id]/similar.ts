import Database from "better-sqlite3";
import { defineEventHandler, getRouterParam } from "h3";

const db = new Database("movies.db");

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Movie ID is required",
    });
  }

  try {
    // Get the current movie
    const stmt = db.prepare("SELECT * FROM movies WHERE id = ?");
    const currentMovie = stmt.get(id) as any;

    if (!currentMovie) {
      throw createError({
        statusCode: 404,
        statusMessage: "Movie not found",
      });
    }

    const filter = { title: { $ne: currentMovie.title } };

    const pc = await initPinecone();
    const denseIndex = pc.index(PINECONE_INDEXES.MOVIES_DENSE);
    const denseResults = await denseIndex.searchRecords({
      query: {
        inputs: {
          text: `${currentMovie.title} \n ${currentMovie.description}`,
        },
        topK: 10,
        filter,
      },
    });
    console.log("Dense results:", denseResults.result.hits);

    const sparseIndex = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
    const sparseResults = await sparseIndex.searchRecords({
      query: {
        inputs: {
          text: `${currentMovie.title} \n ${currentMovie.description}`,
        },
        topK: 10,
        filter,
      },
    });
    console.log("Sparse results:", sparseResults.result.hits);

    const allDescriptions = [
      ...denseResults.result.hits,
      ...sparseResults.result.hits,
    ].map((hit) => {
      return {
        id: hit._id,
        text: (hit.fields as { text: string }).text,
      };
    });

    const rerankResults = await pc.inference.rerank(
      "bge-reranker-v2-m3",
      `${currentMovie.title} \n ${currentMovie.description}`,
      allDescriptions,
      { topN: 10, rankFields: ["text"], returnDocuments: true }
    );
    console.log(
      "Rerank results:",
      rerankResults.data.map((movie) => movie.document?.id)
    );

    // Remove duplicates while keeping order, adding the movie object directly to the set
    const similarMovieIds = new Set();
    for (const doc of rerankResults.data) {
      similarMovieIds.add(doc.document?.id);
    }
    console.log("Similar movies:", similarMovieIds);

    // Get movie IDs from vector search results
    const movieIds = Array.from(similarMovieIds);
    const placeholders = movieIds.map(() => "?").join(",");
    const query = `SELECT * FROM movies WHERE id IN (${placeholders})`;
    const similarMovies = db.prepare(query).all(...movieIds);

    return {
      currentMovie: {
        id: currentMovie.id,
        title: currentMovie.title,
        genre: currentMovie.genre,
        release_date: currentMovie.release_date,
        vote_average: currentMovie.vote_average,
      },
      similarMovies,
    };
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
