import Groq from "groq-sdk";

// Model names as constants
export const GROQ_MODELS = {
  LLAMA3_8B: "llama3-8b-8192",
  LLAMA3_70B: "llama3-70b-8192",
  LLAMA4_SCOUT_17B: "meta-llama/llama-4-scout-17b-16e-instruct",
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  GEMMA2_9B: "gemma2-9b-it",
  COMPOUND_BETA_MINI: "compound-beta",
} as const;

// Singleton instance
let groqInstance: Groq | null = null;

// Initialize Groq client (singleton)
export async function getGroqClient() {
  if (groqInstance) {
    return groqInstance;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }

  groqInstance = new Groq({
    apiKey: apiKey,
  });

  return groqInstance;
}
