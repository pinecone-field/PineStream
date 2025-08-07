import Groq from "groq-sdk";

// Model names as constants
export const GROQ_MODELS = {
  LLAMA3_8B: "llama3-8b-8192",
  LLAMA3_70B: "llama3-70b-8192",
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  GEMMA2_9B: "gemma2-9b-it",
} as const;

// Initialize Groq client
export async function initGroq() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }

  const groq = new Groq({
    apiKey: apiKey,
  });

  return groq;
}
