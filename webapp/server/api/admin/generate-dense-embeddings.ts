const adminService = new AdminService();

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

// Helper function to create chunk mapping from chunk record
function createChunkMapping(record: ChunkRecord): ChunkMapping {
  return {
    id: record.id,
    movieId: record.movieId,
    chunkIndex: record.chunkIndex,
    totalChunks: record.totalChunks,
    source: record.source,
  };
}

// Helper function to convert ChunkRecord to Pinecone format
function toPineconeFormat(record: ChunkRecord): any {
  return {
    id: record.id,
    text: record.text,
    title: record.title,
    genre: record.genre,
    movie_id: record.movieId,
    chunk_index: record.chunkIndex,
    total_chunks: record.totalChunks,
    source: record.source,
    ...(record.releaseDate && { release_date: record.releaseDate }),
  };
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

    // Prepare chunk_mappings table (create if needed, clear existing) using the new AdminService
    adminService.prepareChunkMappingsTable();

    // Get all movies from database using the new AdminService
    const movies: Movie[] = adminService.getAllMovies();

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

    let currentBatch: ChunkRecord[] = [];
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
        const releaseTimestamp = dateToTimestamp(movie.release_date ?? "");

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

            const chunkRecord: ChunkRecord = {
              id: chunkId,
              text: chunk,
              title: movie.title || "Unknown Title",
              genre: genreArray,
              movieId: movie.id,
              chunkIndex: chunkIndex,
              totalChunks: plotChunks.length,
              source: "plot",
              ...(releaseTimestamp && { releaseDate: releaseTimestamp }),
            };

            currentBatch.push(chunkRecord);

            // If batch is full, start processing it in parallel
            if (currentBatch.length >= maxChunksPerBatch) {
              const batchToProcess = [...currentBatch];
              const currentBatchCount = batchCount + 1;

              // Create a promise for this batch
              const batchPromise = (async () => {
                try {
                  // Convert to Pinecone format for upsert
                  const pineconeBatch = batchToProcess.map(toPineconeFormat);
                  await index.upsertRecords(pineconeBatch);
                  totalChunks += batchToProcess.length;

                  // Only store chunk mappings after successful Pinecone upsert
                  const chunkMappings: ChunkMapping[] =
                    batchToProcess.map(createChunkMapping);
                  adminService.insertChunkMappingsBatch(chunkMappings);

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

            const chunkRecord: ChunkRecord = {
              id: chunkId,
              text: chunk,
              title: movie.title || "Unknown Title",
              genre: genreArray,
              movieId: movie.id,
              chunkIndex: chunkIndex,
              totalChunks: overviewChunks.length,
              source: "overview",
              ...(releaseTimestamp && { releaseDate: releaseTimestamp }),
            };

            currentBatch.push(chunkRecord);

            // If batch is full, start processing it in parallel
            if (currentBatch.length >= maxChunksPerBatch) {
              const batchToProcess = [...currentBatch];
              const currentBatchCount = batchCount + 1;

              // Create a promise for this batch
              const batchPromise = (async () => {
                try {
                  // Convert to Pinecone format for upsert
                  const pineconeBatch = batchToProcess.map(toPineconeFormat);
                  await index.upsertRecords(pineconeBatch);
                  totalChunks += batchToProcess.length;

                  // Only store chunk mappings after successful Pinecone upsert
                  const chunkMappings: ChunkMapping[] =
                    batchToProcess.map(createChunkMapping);
                  adminService.insertChunkMappingsBatch(chunkMappings);

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
          // Convert to Pinecone format for upsert
          const pineconeBatch = batchToProcess.map(toPineconeFormat);
          await index.upsertRecords(pineconeBatch);
          totalChunks += batchToProcess.length;

          // Only store chunk mappings after successful Pinecone upsert
          const chunkMappings: ChunkMapping[] =
            batchToProcess.map(createChunkMapping);
          adminService.insertChunkMappingsBatch(chunkMappings);
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

    return {
      status: "success",
      message: `Dense embedding generation completed. Processed ${totalChunks} chunks in ${duration} seconds.`,
      totalChunks: totalChunks,
    };
  } catch (error) {
    console.error("Error generating dense embeddings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate dense embeddings",
    });
  }
});
