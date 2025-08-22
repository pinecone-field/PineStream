const db = getDatabase();

// Global progress tracking for sparse embeddings
(global as any).sparseProgress = {
  isRunning: false,
  processed: 0,
  total: 0,
  startTime: 0,
  message: "",
};

// Helper function to convert date string to timestamp
function dateToTimestamp(dateString: string): number | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date.getTime();
}

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  // Check if already running
  if ((global as any).sparseProgress.isRunning) {
    throw createError({
      statusCode: 409,
      statusMessage: "Sparse embedding generation is already running",
    });
  }

  try {
    const startTime = Date.now();

    // Get all movies from database
    const moviesStmt = db.prepare(`
      SELECT id, title, overview, plot, genre, release_date, vote_average 
      FROM movies 
      ORDER BY id
    `);
    const movies = moviesStmt.all() as any[];

    // Process movies with batching for the full plots
    const maxRecordsPerBatch = parseInt(process.env.SPARSE_BATCH_SIZE || "50");
    const maxConcurrentBatches = parseInt(
      process.env.MAX_CONCURRENT_BATCHES || "1"
    );

    // Initialize progress
    (global as any).sparseProgress = {
      isRunning: true,
      processed: 0,
      total: movies.length,
      startTime,
      message: "Processing...",
    };

    let processedCount = 0;
    let totalRecords = 0;

    const pc = await initPinecone();
    const index = pc.index(PINECONE_INDEXES.MOVIES_SPARSE);

    let currentBatch: any[] = [];
    let batchCount = 0;
    let pendingBatches: Promise<void>[] = [];

    // Rate limiting helper
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (const movie of movies) {
      try {
        // Get both plot and overview text
        const plotText = movie.plot || "";
        const overviewText = movie.overview || "";

        // Skip movies with no plot AND no overview
        if (!plotText.trim() && !overviewText.trim()) {
          processedCount++;
          continue;
        }

        // Convert genre string to array of strings
        const genreArray = movie.genre
          ? movie.genre
              .split(",")
              .map((g: string) => g.trim().toLowerCase())
              .filter((g: string) => g.length > 0)
          : [];

        // Convert release_date string to numeric timestamp
        const releaseTimestamp = dateToTimestamp(movie.release_date);

        // Create a record for plot text if available
        if (plotText.trim()) {
          currentBatch.push({
            id: `${movie.id}_plot`,
            text: plotText,
            title: movie.title,
            genre: genreArray,
            movie_id: movie.id,
            source: "plot",
            ...(releaseTimestamp && { release_date: releaseTimestamp }),
          });
        }

        // Create a record for overview text if available
        if (overviewText.trim()) {
          currentBatch.push({
            id: `${movie.id}_overview`,
            text: overviewText,
            title: movie.title,
            genre: genreArray,
            movie_id: movie.id,
            source: "overview",
            ...(releaseTimestamp && { release_date: releaseTimestamp }),
          });
        }

        // If batch is full, start processing it in parallel
        if (currentBatch.length >= maxRecordsPerBatch) {
          const batchToProcess = [...currentBatch];
          const currentBatchCount = batchCount + 1;

          // Create a promise for this batch
          const batchPromise = (async () => {
            try {
              await index.upsertRecords(batchToProcess);
              totalRecords += batchToProcess.length;

              // Add delay after successful batch to respect rate limits
              await delay(1000); // 1 second delay between batches
            } catch (error) {
              console.error(
                `Error processing batch ${currentBatchCount}:`,
                error
              );
              // If we hit rate limits, wait longer
              if (
                error &&
                typeof error === "object" &&
                "status" in error &&
                error.status === 429
              ) {
                await delay(5000);
              }
            }
          })();

          pendingBatches.push(batchPromise);
          batchCount++;
          currentBatch = [];

          // If we have too many pending batches, wait for one to complete
          if (pendingBatches.length >= maxConcurrentBatches) {
            await Promise.race(pendingBatches);
            // Clean up by removing the first promise (simplified approach)
            pendingBatches.shift();
          }
        }

        processedCount++;

        // Update global progress
        (global as any).sparseProgress.processed = processedCount;
      } catch (error) {
        console.error(`Error processing movie ${movie.id}:`, error);
        processedCount++;
        // Continue processing other movies even if one fails
      }
    }

    // Upsert any remaining records in the final batch
    if (currentBatch.length > 0) {
      const batchToProcess = [...currentBatch];
      const currentBatchCount = batchCount + 1;

      const batchPromise = (async () => {
        try {
          await index.upsertRecords(batchToProcess);
          totalRecords += batchToProcess.length;
        } catch (error) {
          console.error(
            `Error processing final batch ${currentBatchCount}:`,
            error
          );
        }
      })();

      pendingBatches.push(batchPromise);
      batchCount++;
    }

    // Wait for all remaining batches to complete
    if (pendingBatches.length > 0) {
      await Promise.all(pendingBatches);
    }

    // Mark as completed
    const result = {
      message: `Sparse embeddings generated successfully! Processed ${processedCount} movies with ${totalRecords} total records`,
      status: "completed",
      timestamp: new Date().toISOString(),
    };

    (global as any).sparseProgress = {
      isRunning: false,
      processed: processedCount,
      total: movies.length,
      startTime,
      message: result.message,
    };

    return result;
  } catch (error) {
    console.error("Error generating sparse embeddings:", error);

    // Mark as failed
    (global as any).sparseProgress.isRunning = false;
    (global as any).sparseProgress.message =
      "Failed to generate sparse embeddings";

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
