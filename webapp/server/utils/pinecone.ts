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
export async function getPineconeClient() {
  // Check environment variables first to update global status
  checkEnvironmentVariables();

  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      setPineconeAvailable(false);
      throw new Error("PINECONE_API_KEY environment variable is required");
    }
    try {
      pineconeClient = new Pinecone({ apiKey: apiKey });
      if (!indexesValidated) {
        await ensureIndexesExist(pineconeClient);
        indexesValidated = true;
      }
      setPineconeAvailable(true);
      return pineconeClient;
    } catch (error) {
      setPineconeAvailable(false);
      throw error;
    }
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

// Helper function to convert date string to timestamp for Pinecone metadata
// Pinecone doesn't support Date objects in metadata, so we convert to numbers
export function dateToNumber(dateString: string): number | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date.getTime();
}
