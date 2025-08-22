// Test setup file
import { beforeAll, afterAll } from "vitest";

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_FILE = "movies_small.db"; // Use smaller test database
});

afterAll(() => {
  // Cleanup after all tests
});
