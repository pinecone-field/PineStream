import { describe, it, expect, beforeAll } from "vitest";

describe("RecursiveCharacterTextSplitter", () => {
  let movieService: MovieService;
  let sampleMovie: any;

  beforeAll(() => {
    movieService = new MovieService();

    // Get a random movie with a plot for testing using the new MovieService
    sampleMovie = movieService.getRandomMovieWithPlot();

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
  });

  it("should maintain text integrity across chunks", async () => {
    const plotText = sampleMovie.plot || sampleMovie.overview || "";
    const config = DEFAULT_SPLITTER_CONFIG;

    const chunks = await splitText(plotText);

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
