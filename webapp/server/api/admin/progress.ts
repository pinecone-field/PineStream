export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  // Return both dense and sparse progress from global state
  const denseProgress = (global as any).denseProgress || {
    isRunning: false,
    processed: 0,
    total: 0,
    startTime: 0,
    message: "",
  };

  const sparseProgress = (global as any).sparseProgress || {
    isRunning: false,
    processed: 0,
    total: 0,
    startTime: 0,
    message: "",
  };

  return {
    dense: denseProgress,
    sparse: sparseProgress,
  };
});
