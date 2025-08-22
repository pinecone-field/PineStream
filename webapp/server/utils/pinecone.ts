import { Pinecone } from "@pinecone-database/pinecone";

// Index names as constants
export const PINECONE_INDEXES = {
  MOVIES_DENSE: "movies-dense",
  MOVIES_SPARSE: "movies-sparse",
} as const;

// Singleton Pinecone client instance
let pineconeClient: Pinecone | null = null;
let indexesValidated = false;

// Initialize Pinecone client (with index validation)
export async function initPinecone() {
  if (pineconeClient) {
    return pineconeClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is required");
  }

  pineconeClient = new Pinecone({
    apiKey: apiKey,
  });

  // Only validate indexes once when the module is first loaded
  if (!indexesValidated) {
    await ensureIndexesExist(pineconeClient);
    indexesValidated = true;
  }

  return pineconeClient;
}

// Helper function to ensure required indexes exist
async function ensureIndexesExist(pc: Pinecone) {
  const indexes = await pc.listIndexes();
  const indexNames = indexes.indexes?.map((index) => index.name) || [];

  if (!indexNames.includes(PINECONE_INDEXES.MOVIES_DENSE)) {
    await pc.createIndexForModel({
      name: PINECONE_INDEXES.MOVIES_DENSE,
      cloud: "aws",
      region: "us-east-1",
      embed: {
        model: "multilingual-e5-large",
        fieldMap: { text: "text" },
      },
      waitUntilReady: true,
    });
  }

  if (!indexNames.includes(PINECONE_INDEXES.MOVIES_SPARSE)) {
    await pc.createIndexForModel({
      name: PINECONE_INDEXES.MOVIES_SPARSE,
      cloud: "aws",
      region: "us-east-1",
      embed: {
        model: "pinecone-sparse-english-v0",
        fieldMap: { text: "text" },
      },
      waitUntilReady: true,
    });
  }
}
