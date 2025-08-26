// Global API status flags
export let isPineconeAvailable = false;
export let isGroqAvailable = false;

// Functions to set the status (called by utility files when they successfully connect)
export function setPineconeAvailable(available: boolean) {
  isPineconeAvailable = available;
}

export function setGroqAvailable(available: boolean) {
  isGroqAvailable = available;
}

// Helper function to check if both APIs are available
export function areApisAvailable(): boolean {
  return isPineconeAvailable && isGroqAvailable;
}

// Check current environment variable status
export function checkEnvironmentVariables() {
  const hasPineconeKey = !!process.env.PINECONE_API_KEY;
  const hasGroqKey = !!process.env.GROQ_API_KEY;

  // Update flags based on current environment
  isPineconeAvailable = hasPineconeKey;
  isGroqAvailable = hasGroqKey;

  return { hasPineconeKey, hasGroqKey };
}

// Initialize status on module load (for SSR)
export function initializeDefaultStatus() {
  checkEnvironmentVariables();
}

// Call this when the module is imported
initializeDefaultStatus();
