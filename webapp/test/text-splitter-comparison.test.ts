import { describe, it, expect, beforeAll } from "vitest";
import {
  RecursiveCharacterTextSplitter,
  CharacterTextSplitter,
  TokenTextSplitter,
  MarkdownTextSplitter,
} from "@langchain/textsplitters";
import { getDatabase } from "~/server/utils/database";

describe("Text Splitter Comparison for Movie Plots", () => {
  let db: any;
  let sampleMovies: any[];

  beforeAll(async () => {
    // Get database connection
    db = getDatabase();

    // Get total count of movies with plots
    const totalMoviesStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM movies 
      WHERE plot IS NOT NULL AND plot != ''
    `);
    const totalMovies = totalMoviesStmt.get() as { count: number };

    // Sample 10% of movies or max 20, whichever is smaller
    const sampleSize = Math.min(
      20,
      Math.max(5, Math.floor(totalMovies.count * 0.1))
    );

    // Get a representative sample of movies
    const randomMoviesStmt = db.prepare(`
      SELECT id, title, plot, overview, genre, release_date 
      FROM movies 
      WHERE plot IS NOT NULL AND plot != '' 
      ORDER BY RANDOM() 
      LIMIT ?
    `);
    sampleMovies = randomMoviesStmt.all(sampleSize);

    if (sampleMovies.length === 0) {
      throw new Error("No movies with plots found in database for testing");
    }
  });

  it("should compare different text splitters on multiple movie plots", async () => {
    // Test different text splitters
    const splitters = [
      {
        name: "RecursiveCharacterTextSplitter (Current)",
        splitter: new RecursiveCharacterTextSplitter({
          chunkSize: 750,
          chunkOverlap: 250,
        }),
        description: "Character-based splitting with overlap",
      },
      {
        name: "CharacterTextSplitter",
        splitter: new CharacterTextSplitter({
          chunkSize: 750,
          chunkOverlap: 250,
        }),
        description: "Simple character-based splitting",
      },
      {
        name: "TokenTextSplitter",
        splitter: new TokenTextSplitter({
          chunkSize: 750,
          chunkOverlap: 250,
        }),
        description: "Token-based splitting (more accurate for LLMs)",
      },
      {
        name: "MarkdownTextSplitter",
        splitter: new MarkdownTextSplitter({
          chunkSize: 750,
          chunkOverlap: 250,
        }),
        description: "Markdown-aware splitting (respects document structure)",
      },
    ];

    // Aggregate results across all sample movies
    const aggregatedResults = splitters.map((splitter) => ({
      name: splitter.name,
      description: splitter.description,
      totalMovies: 0,
      totalChunks: 0,
      totalOverlap: 0,
      totalSentenceBreaks: 0,
      totalCoherenceScore: 0,
      avgChunkSize: 0,
      avgOverlap: 0,
      avgSentenceBreaks: 0,
      avgCoherenceScore: 0,
      success: true,
      errors: [] as string[],
    }));

    console.log(
      `\n🎬 Testing ${splitters.length} text splitters on ${sampleMovies.length} movies`
    );

    // Process each movie with each splitter
    for (let movieIndex = 0; movieIndex < sampleMovies.length; movieIndex++) {
      const movie = sampleMovies[movieIndex];
      const plotText = movie.plot || movie.overview || "";

      if (!plotText.trim()) continue;

      for (
        let splitterIndex = 0;
        splitterIndex < splitters.length;
        splitterIndex++
      ) {
        const splitterInfo = splitters[splitterIndex];
        const result = aggregatedResults[splitterIndex];

        try {
          const chunks = await splitterInfo.splitter.splitText(plotText);
          const analysis = analyzeChunks(chunks, plotText);

          // Aggregate statistics
          result.totalMovies++;
          result.totalChunks += chunks.length;
          result.totalOverlap += analysis.avgOverlap;
          result.totalSentenceBreaks += analysis.sentenceBreaks;
          result.totalCoherenceScore += analysis.coherenceScore;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.errors.push(`Movie "${movie.title}": ${errorMessage}`);
        }
      }
    }

    // Calculate averages
    aggregatedResults.forEach((result) => {
      if (result.totalMovies > 0) {
        result.avgChunkSize = result.totalChunks / result.totalMovies;
        result.avgOverlap = result.totalOverlap / result.totalMovies;
        result.avgSentenceBreaks =
          result.totalSentenceBreaks / result.totalMovies;
        result.avgCoherenceScore =
          result.totalCoherenceScore / result.totalMovies;
      }
    });

    // Sort by average coherence score
    const sortedResults = [...aggregatedResults].sort(
      (a, b) => b.avgCoherenceScore - a.avgCoherenceScore
    );

    sortedResults.forEach((result, index) => {
      // Results processed
      if (result.errors.length > 0) {
        // Has errors
      }
    });

    // Assertions
    expect(aggregatedResults.length).toBeGreaterThan(0);
    aggregatedResults.forEach((result) => {
      expect(result.totalMovies).toBeGreaterThan(0);
      expect(result.avgCoherenceScore).toBeGreaterThan(0);
    });
  });

  it("should test different chunk sizes with RecursiveCharacterTextSplitter", async () => {
    // Use the first movie from our sample for this test
    const sampleMovie = sampleMovies[0];
    const plotText = sampleMovie.plot || sampleMovie.overview || "";

    // Test different chunk size configurations
    const configs = [
      {
        chunkSize: 500,
        chunkOverlap: 100,
        name: "Small chunks",
      },
      {
        chunkSize: 750,
        chunkOverlap: 250,
        name: "Medium chunks",
      },
      {
        chunkSize: 1200,
        chunkOverlap: 300,
        name: "Large chunks",
      },
    ];

    for (const config of configs) {
      console.log(
        `\n🧪 Testing RecursiveCharacterTextSplitter: ${config.name}`
      );

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
      });

      const chunks = await splitter.splitText(plotText);
      const analysis = analyzeChunks(chunks, plotText);

      console.log(`   Chunks: ${chunks.length}`);
      console.log(`   Avg size: ${analysis.avgChunkSize.toFixed(1)} chars`);
      console.log(`   Sentence breaks: ${analysis.sentenceBreaks}`);
      console.log(`   Coherence: ${analysis.coherenceScore.toFixed(2)}/10`);

      // Assertions
      expect(chunks.length).toBeGreaterThan(0);
      // Note: Movie plots naturally have many sentence breaks, so we're lenient with all chunk sizes
      const maxAllowedBreaks = chunks.length * 0.9; // Allow up to 90% sentence breaks
      expect(analysis.sentenceBreaks).toBeLessThanOrEqual(maxAllowedBreaks);
    }
  });

  it("should compare RecursiveCharacterTextSplitter configurations across multiple movies", async () => {
    // Test different RecursiveCharacterTextSplitter configurations
    const configs = [
      {
        name: "Small chunks (500/100)",
        chunkSize: 500,
        chunkOverlap: 100,
        description: "High granularity, lower coherence",
      },
      {
        name: "Medium chunks (750/250)",
        chunkSize: 750,
        chunkOverlap: 250,
        description: "Balanced approach (current default)",
      },
      {
        name: "Large chunks (1000/200)",
        chunkSize: 1000,
        chunkOverlap: 200,
        description: "Lower granularity, higher coherence",
      },
      {
        name: "Large chunks (1200/300)",
        chunkSize: 1200,
        chunkOverlap: 300,
        description: "Maximum coherence, minimum chunks",
      },
      {
        name: "High overlap (750/400)",
        chunkSize: 750,
        chunkOverlap: 400,
        description: "Maximum context preservation",
      },
      {
        name: "Low overlap (750/100)",
        chunkSize: 750,
        chunkOverlap: 100,
        description: "Minimum context preservation",
      },
    ];

    // Aggregate results across all sample movies for each configuration
    const aggregatedResults = configs.map((config) => ({
      name: config.name,
      description: config.description,
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      totalMovies: 0,
      totalChunks: 0,
      totalOverlap: 0,
      totalSentenceBreaks: 0,
      totalCoherenceScore: 0,
      avgChunkSize: 0,
      avgOverlap: 0,
      avgSentenceBreaks: 0,
      avgCoherenceScore: 0,
      avgChunksPerMovie: 0,
      success: true,
      errors: [] as string[],
    }));

    console.log(
      `\n🔧 Testing ${configs.length} RecursiveCharacterTextSplitter configurations on ${sampleMovies.length} movies`
    );
    console.log(`📝 Total plots to process: ${sampleMovies.length}`);
    console.log();

    // Process each movie with each configuration
    for (let movieIndex = 0; movieIndex < sampleMovies.length; movieIndex++) {
      const movie = sampleMovies[movieIndex];
      const plotText = movie.plot || movie.overview || "";

      if (!plotText.trim()) continue;

      for (let configIndex = 0; configIndex < configs.length; configIndex++) {
        const config = configs[configIndex];
        const result = aggregatedResults[configIndex];

        try {
          const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: config.chunkSize,
            chunkOverlap: config.chunkOverlap,
          });

          const chunks = await splitter.splitText(plotText);
          const analysis = analyzeChunks(chunks, plotText);

          // Aggregate statistics
          result.totalMovies++;
          result.totalChunks += chunks.length;
          result.totalOverlap += analysis.avgOverlap;
          result.totalSentenceBreaks += analysis.sentenceBreaks;
          result.totalCoherenceScore += analysis.coherenceScore;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.errors.push(`Movie "${movie.title}": ${errorMessage}`);
        }
      }
    }

    // Calculate averages
    aggregatedResults.forEach((result) => {
      if (result.totalMovies > 0) {
        result.avgChunkSize = result.totalChunks / result.totalMovies;
        result.avgOverlap = result.totalOverlap / result.totalMovies;
        result.avgSentenceBreaks =
          result.totalSentenceBreaks / result.totalMovies;
        result.avgCoherenceScore =
          result.totalCoherenceScore / result.totalMovies;
        result.avgChunksPerMovie = result.totalChunks / result.totalMovies;
      }
    });

    // Sort by average coherence score
    const sortedResults = [...aggregatedResults].sort(
      (a, b) => b.avgCoherenceScore - a.avgCoherenceScore
    );

    sortedResults.forEach((result, index) => {
      // Results processed
      if (result.errors.length > 0) {
        // Has errors
      }
    });

    // Assertions
    expect(aggregatedResults.length).toBeGreaterThan(0);
    aggregatedResults.forEach((result) => {
      expect(result.totalMovies).toBeGreaterThan(0);
      expect(result.avgCoherenceScore).toBeGreaterThan(0);
    });
  });
});

// Helper function to analyze chunk quality
function analyzeChunks(chunks: string[], originalText: string) {
  if (chunks.length === 0) {
    return {
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      avgOverlap: 0,
      sentenceBreaks: 0,
      coherenceScore: 0,
    };
  }

  // Basic statistics
  const chunkSizes = chunks.map((chunk) => chunk.length);
  const avgChunkSize = chunkSizes.reduce((a, b) => a + b, 0) / chunks.length;
  const minChunkSize = Math.min(...chunkSizes);
  const maxChunkSize = Math.max(...chunkSizes);

  // Calculate overlaps
  let totalOverlap = 0;
  let overlapCount = 0;
  for (let i = 1; i < chunks.length; i++) {
    const overlap = findOverlap(chunks[i - 1], chunks[i]);
    totalOverlap += overlap.length;
    overlapCount++;
  }
  const avgOverlap = overlapCount > 0 ? totalOverlap / overlapCount : 0;

  // Count sentence breaks (chunks that don't end with sentence-ending punctuation)
  const sentenceBreaks = chunks.filter((chunk) => {
    const trimmed = chunk.trim();
    return trimmed.length > 0 && !/[.!?]/.test(trimmed[trimmed.length - 1]);
  }).length;

  // Calculate coherence score (0-10)
  let coherenceScore = 10;

  // Penalize for too many sentence breaks
  const sentenceBreakRatio = sentenceBreaks / chunks.length;
  if (sentenceBreakRatio > 0.5) coherenceScore -= 3;
  else if (sentenceBreakRatio > 0.3) coherenceScore -= 2;
  else if (sentenceBreakRatio > 0.1) coherenceScore -= 1;

  // Penalize for very uneven chunk sizes
  const sizeVariation = (maxChunkSize - minChunkSize) / avgChunkSize;
  if (sizeVariation > 1.0) coherenceScore -= 2;
  else if (sizeVariation > 0.5) coherenceScore -= 1;

  // Bonus for good overlap
  if (avgOverlap > 0 && avgOverlap < avgChunkSize * 0.3) coherenceScore += 1;

  coherenceScore = Math.max(0, Math.min(10, coherenceScore));

  return {
    avgChunkSize,
    minChunkSize,
    maxChunkSize,
    avgOverlap,
    sentenceBreaks,
    coherenceScore,
  };
}

// Helper function to find overlap between two chunks
function findOverlap(chunk1: string, chunk2: string): string {
  const minLength = Math.min(chunk1.length, chunk2.length);

  for (let i = minLength; i > 0; i--) {
    const suffix = chunk1.slice(-i);
    const prefix = chunk2.slice(0, i);

    if (suffix === prefix) {
      return suffix;
    }
  }

  return "";
}
