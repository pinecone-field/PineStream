const adminService = new AdminService();

// Global progress tracking
(global as any).denseProgress = {
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
async function extractChunksForMovie(movie: Movie): Promise<ChunkRecord[]> {
  const chunks: ChunkRecord[] = [];

  // =============================================================
  // PLACEHOLDER ID: dense-embeddings-extract
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
  //
  // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
  // =============================================================

  return chunks;
}

/**
 * The endpoint calls this function passing some chunks
 * to upsert into the Pinecone index.
 *
 * The function is expected to
 *  - Upsert chunks into the Pinecone index
 *  - Store the mappings of chunks to movies in the database after successful upsert
 */
async function upsertChunksToPinecone(chunks: ChunkRecord[]): Promise<void> {
  // =============================================================
  // PLACEHOLDER ID: dense-embeddings-upsert
  // NOTE: Add your code for each step below.
  // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  //
  // STEP 1: Upsert chunks into the Pinecone index
  //
  //
  // STEP 2: Store the mappings of chunks to movies in the database after successful upsert
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
  if ((global as any).denseProgress.isRunning) {
    throw createError({
      statusCode: 409,
      statusMessage: "Dense embedding generation is already running",
    });
  }

  let startTime = Date.now();
  let movies: Movie[] = [];
  let totalChunks = 0;

  try {
    // Prepare chunk_mappings table (create if needed, clear existing) using the new AdminService
    adminService.prepareChunkMappingsTable();

    // Get all movies from database using the new AdminService
    movies = adminService.getAllMovies();

    // Process movies and create chunks with chunk-based batching
    const maxChunksPerBatch = parseInt(process.env.DENSE_BATCH_SIZE || "50");
    const maxConcurrentBatches = parseInt(
      process.env.MAX_CONCURRENT_BATCHES || "1"
    );

    // Initialize progress
    (global as any).denseProgress = {
      isRunning: true,
      processed: 0,
      total: movies.length,
      startTime,
      message: "Processing...",
    };

    let processedCount = 0;

    let currentBatch: ChunkRecord[] = [];
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
          for (const chunk of movieChunks) {
            currentBatch.push(chunk);

            // If the current batch is full, start processing it in parallel
            if (currentBatch.length >= maxChunksPerBatch) {
              const batchToProcess = [...currentBatch];
              const currentBatchCount = batchCount + 1;

              // Create a promise for the current batch
              const batchPromise = (async () => {
                try {
                  // Process the entire batch at once using Pinecone's batch upsert
                  await upsertChunksToPinecone(batchToProcess);
                  totalChunks += batchToProcess.length;

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
          }
          processedCount++;
        }

        // Update global progress
        (global as any).denseProgress.processed = processedCount;
      } catch (error) {
        console.error(`Error processing movie ${movie.id}:`, error);
        processedCount++;
        // Continue processing other movies even if one fails
      }
    }

    // Upsert any remaining chunks in the final batch
    if (currentBatch.length > 0) {
      const batchToProcess = [...currentBatch];
      const currentBatchCount = batchCount + 1;

      const batchPromise = (async () => {
        try {
          // Process the entire batch at once using Pinecone's batch upsert
          await upsertChunksToPinecone(batchToProcess);
          totalChunks += batchToProcess.length;
        } catch (error) {
          console.error(`Error processing batch ${currentBatchCount}:`, error);
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
      // If we have too many pending batches, wait for one to complete
      if (pendingBatches.length >= maxConcurrentBatches) {
        await Promise.race(pendingBatches);
        // Clean up by removing the first promise (simplified approach)
        pendingBatches.shift();
      }
    }

    // Wait for all pending batches to complete
    await Promise.all(pendingBatches);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds

    // Update global progress to show completion
    (global as any).denseProgress = {
      isRunning: false,
      processed: movies.length,
      total: movies.length,
      startTime: startTime,
      message: `Completed! Processed ${totalChunks} chunks in ${duration} seconds.`,
    };

    return {
      status: "success",
      message: `Dense embedding generation completed. Processed ${totalChunks} chunks in ${duration} seconds.`,
      totalChunks: totalChunks,
    };
  } catch (error) {
    console.error("Error generating dense embeddings:", error);

    // Update global progress to show error state
    (global as any).denseProgress = {
      isRunning: false,
      processed: 0,
      total: 0,
      startTime: 0,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate dense embeddings",
    });
  }
});
