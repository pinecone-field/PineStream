const db = getDatabase();

// Global progress tracking
(global as any).denseProgress = {
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
  if ((global as any).denseProgress.isRunning) {
    throw createError({
      statusCode: 409,
      statusMessage: "Dense embedding generation is already running",
    });
  }

  try {
    const startTime = Date.now();

    // Create chunk_mappings table if it doesn't exist
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS chunk_mappings (
        chunk_id TEXT PRIMARY KEY,
        movie_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        total_chunks INTEGER NOT NULL,
        source TEXT NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES movies(id)
      )
    `
    ).run();

    // Clear existing chunk mappings
    db.prepare("DELETE FROM chunk_mappings").run();

    // Get all movies from database
    const moviesStmt = db.prepare(`
      SELECT id, title, overview, plot, genre, release_date, vote_average 
      FROM movies 
      ORDER BY id
    `);
    const movies = moviesStmt.all() as any[];

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
    let totalChunks = 0;

    const pc = await getPineconeClient();
    const index = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

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

        // Process plot text if available
        if (plotText.trim()) {
          const plotChunks = await splitText(plotText);

          // Create a record for each plot chunk
          for (
            let chunkIndex = 0;
            chunkIndex < plotChunks.length;
            chunkIndex++
          ) {
            const chunk = plotChunks[chunkIndex];
            const chunkId = `${movie.id}_plot_chunk_${chunkIndex}`;

            // Store chunk mapping in database
            db.prepare(
              `
              INSERT INTO chunk_mappings (chunk_id, movie_id, chunk_index, total_chunks, source)
              VALUES (?, ?, ?, ?, ?)
            `
            ).run(chunkId, movie.id, chunkIndex, plotChunks.length, "plot");

            currentBatch.push({
              id: chunkId,
              text: chunk,
              title: movie.title,
              genre: genreArray,
              movie_id: movie.id,
              chunk_index: chunkIndex,
              total_chunks: plotChunks.length,
              source: "plot",
              ...(releaseTimestamp && { release_date: releaseTimestamp }),
            });

            // If batch is full, start processing it in parallel
            if (currentBatch.length >= maxChunksPerBatch) {
              const batchToProcess = [...currentBatch];
              const currentBatchCount = batchCount + 1;

              // Create a promise for this batch
              const batchPromise = (async () => {
                try {
                  await index.upsertRecords(batchToProcess);
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
        }

        // Process overview text if available
        if (overviewText.trim()) {
          const overviewChunks = await splitText(overviewText);

          // Create a record for each overview chunk
          for (
            let chunkIndex = 0;
            chunkIndex < overviewChunks.length;
            chunkIndex++
          ) {
            const chunk = overviewChunks[chunkIndex];
            const chunkId = `${movie.id}_overview_chunk_${chunkIndex}`;

            // Store chunk mapping in database
            db.prepare(
              `
              INSERT INTO chunk_mappings (chunk_id, movie_id, chunk_index, total_chunks, source)
              VALUES (?, ?, ?, ?, ?)
            `
            ).run(
              chunkId,
              movie.id,
              chunkIndex,
              overviewChunks.length,
              "overview"
            );

            currentBatch.push({
              id: chunkId,
              text: chunk,
              title: movie.title,
              genre: genreArray,
              movie_id: movie.id,
              chunk_index: chunkIndex,
              total_chunks: overviewChunks.length,
              source: "overview",
              ...(releaseTimestamp && { release_date: releaseTimestamp }),
            });

            // If batch is full, start processing it in parallel
            if (currentBatch.length >= maxChunksPerBatch) {
              const batchToProcess = [...currentBatch];
              const currentBatchCount = batchCount + 1;

              // Create a promise for this batch
              const batchPromise = (async () => {
                try {
                  await index.upsertRecords(batchToProcess);
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
        }

        processedCount++;

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
          await index.upsertRecords(batchToProcess);
          totalChunks += batchToProcess.length;
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
      message: `Dense embeddings generated successfully! Processed ${processedCount} movies with ${totalChunks} total chunks`,
      status: "completed",
      timestamp: new Date().toISOString(),
    };

    (global as any).denseProgress = {
      isRunning: false,
      processed: processedCount,
      total: movies.length,
      startTime,
      message: result.message,
    };

    return result;
  } catch (error) {
    console.error("Error generating dense embeddings:", error);

    // Mark as failed
    (global as any).denseProgress.isRunning = false;
    (global as any).denseProgress.message =
      "Failed to generate dense embeddings";

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
