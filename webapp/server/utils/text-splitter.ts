import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Configuration for text splitting
export interface TextSplitterConfig {
  chunkSize: number;
  chunkOverlap: number;
}

// Default configuration - change these values to adjust text splitting across the entire app
export const DEFAULT_SPLITTER_CONFIG: TextSplitterConfig = {
  chunkSize: 1200,
  chunkOverlap: 300,
};

// Cache for different splitter configurations to avoid recreating instances
const defaultSplitter = new RecursiveCharacterTextSplitter(
  DEFAULT_SPLITTER_CONFIG
);

/**
 * Gets a configured text splitter instance
 * @param config - Optional configuration to override defaults
 * @returns Configured RecursiveCharacterTextSplitter instance
 */
export function getTextSplitter(
  config?: Partial<TextSplitterConfig>
): RecursiveCharacterTextSplitter {
  // If no custom config, return the cached default instance
  if (!config) {
    return defaultSplitter;
  }

  const finalConfig = {
    ...DEFAULT_SPLITTER_CONFIG,
    ...config,
  };

  return new RecursiveCharacterTextSplitter(finalConfig);
}

/**
 * Splits text into chunks using the configured settings
 * @param text - Text to split
 * @param config - Optional configuration to override defaults
 * @returns Array of text chunks
 */
export async function splitText(
  text: string,
  config?: Partial<TextSplitterConfig>
): Promise<string[]> {
  const splitter = getTextSplitter(config);
  return await splitter.splitText(text);
}

// Export the default splitter for direct use
export const defaultTextSplitter = getTextSplitter();
