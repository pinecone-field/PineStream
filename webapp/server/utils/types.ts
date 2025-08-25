// Common types for the application

export interface ChunkRecord {
  id: string;
  text: string;
  title: string;
  genre: string[];
  movieId: number;
  chunkIndex: number;
  totalChunks: number;
  source: string;
  releaseDate?: number;
}

export interface ChunkMapping {
  id: string;
  movieId: number;
  chunkIndex: number;
  totalChunks: number;
  source: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string | null;
  plot: string | null;
  genre: string | null;
  release_date: string | null;
  vote_average: number;
}

export interface BatchProcessingResult {
  success: boolean;
  processedCount: number;
  error?: string;
}

export interface EmbeddingProgress {
  isRunning: boolean;
  processed: number;
  total: number;
  startTime: number;
  message: string;
}
