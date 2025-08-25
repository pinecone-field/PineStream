const userService = new UserService();

export default defineEventHandler(async (event) => {
  try {
    // Clear watched movies using the new UserService
    userService.clearWatchedMovies();

    return { message: "All watched movies cleared" };
  } catch (error) {
    console.error("Error clearing watched movies:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
