import Database from "better-sqlite3";

const db = new Database("movies.db");

async function getDenseEmbeddingsCount(): Promise<number> {
  try {
    const pc = await initPinecone();
    const index = pc.index(PINECONE_INDEXES.MOVIES_DENSE);
    const stats = await index.describeIndexStats();
    const count = stats.totalRecordCount || 0;
    return count;
  } catch (error) {
    console.error("Error getting dense embeddings count:", error);
    return 0;
  }
}

async function getSparseEmbeddingsCount(): Promise<number> {
  try {
    const pc = await initPinecone();
    const index = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);
    const stats = await index.describeIndexStats();
    const count = stats.totalRecordCount || 0;
    return count;
  } catch (error) {
    console.error("Error getting sparse embeddings count:", error);
    return 0;
  }
}

export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    // Get total movies count
    const totalMoviesStmt = db.prepare("SELECT COUNT(*) as count FROM movies");
    const totalMovies = totalMoviesStmt.get() as { count: number };

    // Get watched movies count
    const watchedMoviesStmt = db.prepare(
      "SELECT COUNT(*) as count FROM user_watched_movies"
    );
    const watchedMovies = watchedMoviesStmt.get() as { count: number };

    // Get embedding counts from Pinecone (implemented by students)
    const denseEmbeddings = await getDenseEmbeddingsCount();
    const sparseEmbeddings = await getSparseEmbeddingsCount();

    return {
      totalMovies: totalMovies.count,
      watchedMovies: watchedMovies.count,
      denseEmbeddings,
      sparseEmbeddings,
    };
  } catch (error) {
    console.error("Error fetching database stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
