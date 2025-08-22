import { describe, it, expect, beforeAll } from "vitest";
import {
  splitText,
  DEFAULT_SPLITTER_CONFIG,
} from "~/server/utils/text-splitter";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getDatabase } from "~/server/utils/database";

describe("RecursiveCharacterTextSplitter", () => {
  let db: any;
  let sampleMovie: any;

  beforeAll(async () => {
    // Get database connection
    db = getDatabase();

    // Get a random movie with a plot for testing
    const randomMovieStmt = db.prepare(`
      SELECT id, title, plot, overview 
      FROM movies 
      WHERE plot IS NOT NULL AND plot != '' 
      ORDER BY RANDOM() 
      LIMIT 1
    `);

    sampleMovie = randomMovieStmt.get();

    if (!sampleMovie) {
      throw new Error("No movies with plots found in database for testing");
    }
  });

  it("should split text into chunks with specified size and overlap", async () => {
    const plotText = sampleMovie.plot || sampleMovie.overview || "";
    expect(plotText).toBeTruthy();
    expect(plotText.length).toBeGreaterThan(0);

    // Test with default configuration from config
    const defaultConfig = DEFAULT_SPLITTER_CONFIG;
    const defaultChunks = await splitText(plotText);

    // Test with custom smaller configuration (800/200)
    const customConfig = { chunkSize: 800, chunkOverlap: 200 };
    const customChunks = await splitText(plotText, customConfig);

    // Basic assertions for both configurations
    expect(defaultChunks).toBeInstanceOf(Array);
    expect(customChunks).toBeInstanceOf(Array);
    expect(defaultChunks.length).toBeGreaterThan(0);
    expect(customChunks.length).toBeGreaterThan(0);
    expect(defaultChunks.every((chunk) => typeof chunk === "string")).toBe(
      true
    );
    expect(customChunks.every((chunk) => typeof chunk === "string")).toBe(true);

    // Check default chunk sizes (should be close to default config)
    defaultChunks.forEach((chunk: string, index: number) => {
      expect(chunk.length).toBeGreaterThan(0);
      expect(chunk.length).toBeLessThanOrEqual(defaultConfig.chunkSize * 1.5);
    });

    // Check custom chunk sizes (should be close to 800)
    customChunks.forEach((chunk: string, index: number) => {
      expect(chunk.length).toBeGreaterThan(0);
      expect(chunk.length).toBeLessThanOrEqual(customConfig.chunkSize * 1.5);
    });

    // Custom configuration should create more chunks than default
    expect(customChunks.length).toBeGreaterThan(defaultChunks.length);

    // Check overlaps for default configuration
    for (let i = 1; i < defaultChunks.length; i++) {
      const previousChunk = defaultChunks[i - 1];
      const currentChunk = defaultChunks[i];
      const overlap = findOverlap(previousChunk, currentChunk);

      expect(overlap.length).toBeGreaterThan(0);
      expect(overlap.length).toBeGreaterThanOrEqual(100);
      expect(overlap.length).toBeLessThanOrEqual(
        defaultConfig.chunkOverlap * 2
      );
    }

    // Check overlaps for custom configuration
    for (let i = 1; i < customChunks.length; i++) {
      const previousChunk = customChunks[i - 1];
      const currentChunk = customChunks[i];
      const overlap = findOverlap(previousChunk, currentChunk);

      expect(overlap.length).toBeGreaterThan(0);
      expect(overlap.length).toBeGreaterThanOrEqual(50);
      expect(overlap.length).toBeLessThanOrEqual(customConfig.chunkOverlap * 2);
    }
  });

  it("should use default configuration when no config is provided", async () => {
    const plotText = sampleMovie.plot || sampleMovie.overview || "";

    // Call splitText without any config (should use defaults)
    const chunks = await splitText(plotText);

    // Should use the optimal default configuration from config
    const expectedChunkSize = DEFAULT_SPLITTER_CONFIG.chunkSize;
    const expectedOverlap = DEFAULT_SPLITTER_CONFIG.chunkOverlap;

    // Validate chunk sizes are appropriate for default config
    chunks.forEach((chunk: string) => {
      expect(chunk.length).toBeGreaterThan(0);
      expect(chunk.length).toBeLessThanOrEqual(expectedChunkSize * 1.5);
    });

    // Validate overlaps are appropriate for default config
    for (let i = 1; i < chunks.length; i++) {
      const previousChunk = chunks[i - 1];
      const currentChunk = chunks[i];
      const overlap = findOverlap(previousChunk, currentChunk);

      expect(overlap.length).toBeGreaterThan(0);
      expect(overlap.length).toBeGreaterThanOrEqual(100);
      expect(overlap.length).toBeLessThanOrEqual(expectedOverlap * 2);
    }

    // Log the actual configuration being used
    console.log(`\n=== Default Configuration Test ===`);
    console.log(`Original text length: ${plotText.length} characters`);
    console.log(`Number of chunks: ${chunks.length}`);
    console.log(`Expected chunk size: ~${expectedChunkSize} characters`);
    console.log(`Expected overlap: ~${expectedOverlap} characters`);

    // Show chunk details
    chunks.forEach((chunk: string, index: number) => {
      console.log(`\n--- Chunk ${index + 1} (${chunk.length} chars) ---`);

      if (index > 0) {
        const previousChunk = chunks[index - 1];
        const overlap = findOverlap(previousChunk, chunk);
        console.log(`Overlap with previous: ${overlap.length} chars`);
      }
    });
  });

  it("should maintain text integrity across chunks", async () => {
    const plotText = sampleMovie.plot || sampleMovie.overview || "";
    const config = DEFAULT_SPLITTER_CONFIG;

    const chunks = await splitText(plotText);

    // Log chunk information for debugging
    console.log(`\n=== Text Splitter Test Results ===`);
    console.log(`Original text length: ${plotText.length} characters`);
    console.log(`Number of chunks: ${chunks.length}`);
    console.log(`Expected chunk size: ~${config.chunkSize} characters`);
    console.log(`Expected overlap: ~${config.chunkOverlap} characters`);

    chunks.forEach((chunk: string, index: number) => {
      console.log(`\n--- Chunk ${index + 1} (${chunk.length} chars) ---`);

      // Show start of chunk
      const startText = chunk.substring(0, 100);
      console.log(`START: ${startText}${chunk.length > 100 ? "..." : ""}`);

      // Show end of chunk
      if (chunk.length > 100) {
        const endText = chunk.substring(chunk.length - 100);
        console.log(`END:   ...${endText}`);
      }

      if (index > 0) {
        const previousChunk = chunks[index - 1];
        const overlap = findOverlap(previousChunk, chunk);
        console.log(`Overlap with previous: ${overlap.length} chars`);
        if (overlap.length > 0) {
          console.log(
            `Overlap text: "${overlap.substring(0, 50)}${
              overlap.length > 50 ? "..." : ""
            }"`
          );
        }
      }
    });

    // Test that all chunks contain meaningful content
    chunks.forEach((chunk: string, index: number) => {
      expect(chunk.trim().length).toBeGreaterThan(0);
      expect(chunk.trim().length).toBeGreaterThan(10);
    });

    // Test that overlaps exist between consecutive chunks
    for (let i = 1; i < chunks.length; i++) {
      const previousChunk = chunks[i - 1];
      const currentChunk = chunks[i];
      const overlap = findOverlap(previousChunk, currentChunk);

      // Should have some overlap
      expect(overlap.length).toBeGreaterThan(0);
      // Overlap should be reasonable (not too small, not too large)
      expect(overlap.length).toBeGreaterThanOrEqual(100);
      expect(overlap.length).toBeLessThanOrEqual(config.chunkOverlap * 2);
    }
  });

  it("should preserve movie information in chunks", async () => {
    const plotText = sampleMovie.plot || sampleMovie.overview || "";
    const chunks = await splitText(plotText);

    // Each chunk should contain meaningful content
    chunks.forEach((chunk: string) => {
      expect(chunk.trim().length).toBeGreaterThan(0);
      // Should not be just whitespace or very short
      expect(chunk.trim().length).toBeGreaterThan(10);
    });
  });
});

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
