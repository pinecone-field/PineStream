const db = getDatabase();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Movie ID is required",
    });
  }

  try {
    const stmt = db.prepare("SELECT * FROM movies WHERE id = ?");
    const movie = stmt.get(id) as any;

    if (!movie) {
      throw createError({
        statusCode: 404,
        statusMessage: "Movie not found",
      });
    }

    return movie;
  } catch (error) {
    console.error("Error fetching movie:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
