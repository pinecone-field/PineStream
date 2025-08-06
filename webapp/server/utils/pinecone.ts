import { Pinecone } from "@pinecone-database/pinecone";

// Index names as constants
export const PINECONE_INDEXES = {
  MOVIES_DENSE: "movies-dense",
  MOVIES_SPARSE: "movies-sparse",
} as const;

// Initialize Pinecone client
export async function initPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is required");
  }

  const pc = new Pinecone({
    apiKey: apiKey,
  });

  // TODO: Check if indexes exist and create those that don't
  await ensureIndexesExist(pc);

  return pc;
}

// Helper function to ensure required indexes exist
async function ensureIndexesExist(pc: Pinecone) {
  // PLACEHOLDER:
  // Check if indexes exist and create those that don't
  // END PLACEHOLDER

  console.log("Index validation completed");
}
