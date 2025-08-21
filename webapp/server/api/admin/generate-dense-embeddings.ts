import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
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

    // Get all movies from database
    const moviesStmt = db.prepare(`
      SELECT id, title, overview, genre, release_date, vote_average 
      FROM movies 
      ORDER BY id
    `);
    const movies = moviesStmt.all() as any[];

    console.log(`Processing ${movies.length} movies for dense embeddings...`);

    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < movies.length; i += batchSize) {
      batches.push(movies.slice(i, i + batchSize));
    }

    // Initialize progress
    (global as any).denseProgress = {
      isRunning: true,
      processed: 0,
      total: movies.length,
      startTime,
      message: "Processing...",
    };

    let processedCount = 0;

    const pc = await initPinecone();
    const index = pc.index(PINECONE_INDEXES.MOVIES_DENSE);

    // Process batches with progress updates
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        // Convert movies to records for upsert
        const records = batch.map((movie) => {
          // Convert genre string to array of strings
          const genreArray = movie.genre
            ? movie.genre
                .split(",")
                .map((g: string) => g.trim().toLowerCase())
                .filter((g: string) => g.length > 0)
            : [];

          // Convert release_date string to numeric timestamp
          const releaseTimestamp = dateToTimestamp(movie.release_date);

          return {
            id: movie.id.toString(),
            text: `# ${movie.title}
${movie.overview || ""}
## Movie Details
${movie.release_date ? `**Release date:** ${movie.release_date}` : ""}
${movie.genre ? `**Genre:** ${movie.genre}` : ""}
${movie.original_language ? `**Language:** ${movie.original_language}` : ""}`,
            title: movie.title,
            genre: genreArray,
            ...(releaseTimestamp && { release_date: releaseTimestamp }),
          };
        });

        await index.upsertRecords(records);

        processedCount += batch.length;

        // Update global progress
        (global as any).denseProgress.processed = processedCount;

        console.log(
          `Processed batch ${i + 1}/${batches.length}: ${processedCount}/${
            movies.length
          } movies`
        );
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error);
        // Continue processing other batches even if one fails
      }
    }

    // Mark as completed
    const result = {
      message: `Dense embeddings generated successfully! Processed ${processedCount} movies.`,
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
