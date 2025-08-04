import { Pinecone } from "@pinecone-database/pinecone";

// Index names as constants
export const PINECONE_INDEXES = {
  MOVIES_DENSE: "movies-dense",
  MOVIES_SPARSE: "movies-sparse",
} as const;

// Initialize Pinecone client
export function initPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is required");
  }

  return new Pinecone({
    apiKey: apiKey,
  });
}
