const db = getDatabase();

export default defineEventHandler(async (event) => {
  try {
    // Clear all watched movies
    const clearStmt = db.prepare("DELETE FROM user_watched_movies");
    const result = clearStmt.run();

    return {
      message: "All watched movies cleared",
      deletedCount: result.changes,
    };
  } catch (error) {
    console.error("Error clearing watched movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
