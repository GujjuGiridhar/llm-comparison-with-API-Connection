// src/types/compare.ts

// Represents the result of a single model in the comparison
export type PerformanceResult = {
  connectionId: string;
  connectionName: string;
  status: 'running' | 'complete' | 'error'; // Status of the individual request
  processingTime?: number; // Time from request start to last token received (in seconds)
  responseTime?: number; // Time from request start to first token received (in seconds) - optional for mock
  tokensPerSecond?: number; // Completion tokens / processing time
  totalTokens?: number; // prompt + completion
  promptTokens?: number;
  completionTokens?: number;
  elapsedTime?: number; // Total time shown on progress bar (can be same as processing time)
  output?: string; // The actual text output from the model
  rating?: { // Optional AI-based rating
    rating: number; // e.g., 1-10
    explanation: string;
  };
  // Add other relevant metrics if needed, e.g., cost, specific error message
  errorMessage?: string;
};
