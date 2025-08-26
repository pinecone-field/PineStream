import Groq from "groq-sdk";

// Model names as constants
export const GROQ_MODELS = {
  LLAMA3_8B: "llama3-8b-8192",
  LLAMA3_70B: "llama3-70b-8192",
  LLAMA3_1_8B_INSTANT: "llama-3.1-8b-instant",
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  GEMMA2_9B: "gemma2-9b-it",
  COMPOUND_BETA_MINI: "compound-beta",
  GPT_OSS_120B: "openai/gpt-oss-120b",
  GPT_OSS_20B: "openai/gpt-oss-20b",
  DEEPSEEK_R1_DISTILL_LLAMA_70B: "deepseek-r1-distill-llama-70b",
} as const;

// Singleton instance
let groqInstance: Groq | null = null;

// Initialize Groq client (singleton)
export async function getGroqClient() {
  // Check environment variables first to update global status
  checkEnvironmentVariables();

  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      setGroqAvailable(false);
      throw new Error("GROQ_API_KEY environment variable is required");
    }
    try {
      groqInstance = new Groq({ apiKey: apiKey });
      // Test the connection by listing models (this doesn't use credits)
      await groqInstance.models.list();
      // If we get here, the connection was successful
      setGroqAvailable(true);
      return groqInstance;
    } catch (error) {
      setGroqAvailable(false);
      throw error;
    }
  }
  return groqInstance;
}
