const adminService = new AdminService();

// Global progress tracking for sparse embeddings
(global as any).sparseProgress = {
  isRunning: false,
  processed: 0,
  total: 0,
  startTime: 0,
  message: "",
};

/**
 * The endpoint calls this function passing a movie
 * to extract chunks from the movie's plot and overview.
 *
 * The function is expected to
 *  - Extract chunks from the movie's plot and overview
 *  - Return an array of chunks
 */
async function extractChunksForMovie(movie: Movie): Promise<any[]> {
  const chunks: any[] = [];

  // =============================================================
  // PLACEHOLDER ID: sparse-embeddings-extract
  // NOTE: Add your code for each step below.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  //
  // STEP 1: Assert that the movie has a plot and overview
  //
  //
  // STEP 2: Create chunks from the plot text if available
  //
  //
  // STEP 3: Create chunks from the overview text if available
  //
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================

  return chunks;
}

/**
 * The endpoint calls this function passing some chunks
 * to upsert into the Pinecone index.
 *
 * The function is expected to upsert chunks into the Pinecone index
 */
async function upsertChunksToPinecone(chunks: any[]): Promise<void> {
  // =============================================================
  // PLACEHOLDER ID: sparse-embeddings-upsert
  // NOTE: Add your code below.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  //
  //
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================
}

export default defineEventHandler(async (event) => {
  // Check if required APIs are available
  if (!isPineconeAvailable) {
    return {
      error: "API_UNAVAILABLE",
      message: "Embedding generation is not available.",
      status: "unavailable",
    };
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

    // Get all movies from the database
    const movies = adminService.getAllMovies();

    // Get batch config from environment variables
    const maxRecordsPerBatch = parseInt(process.env.SPARSE_BATCH_SIZE || "50");
    const maxConcurrentBatches = parseInt(
      process.env.MAX_CONCURRENT_BATCHES || "1"
    );

    // Initialize progress tracking
    (global as any).sparseProgress = {
      isRunning: true,
      processed: 0,
      total: movies.length,
      startTime,
      message: "Processing...",
    };

    let processedCount = 0;
    let totalRecords = 0;

    let currentBatch: any[] = [];
    let batchCount = 0;
    let pendingBatches: Promise<void>[] = [];

    // Rate limiting helper
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (const movie of movies) {
      try {
        // Extract chunks for the current movie
        const movieChunks = await extractChunksForMovie(movie);

        // If the current movie has chunks, proceed to upsert them
        if (movieChunks.length > 0) {
          // Add extracted chunks to the current batch
          currentBatch.push(...movieChunks);

          // If the current batch is full, start processing it in parallel
          if (currentBatch.length >= maxRecordsPerBatch) {
            const batchToProcess = [...currentBatch];
            const currentBatchCount = batchCount + 1;

            // Create a promise for the current batch
            const batchPromise = (async () => {
              try {
                await upsertChunksToPinecone(batchToProcess);
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
        }

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
          await upsertChunksToPinecone(batchToProcess);
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
