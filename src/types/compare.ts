// src/types/compare.ts

// Represents the result of a single model in the comparison
export type PerformanceResult = {
  connectionId: string;
  connectionName: string;
  modelName: string; // Added model name used in connection
  status: 'running' | 'complete' | 'error'; // Status of the individual request
  processingTime?: number; // Time from request start to last token received (in seconds)
  responseTime?: number; // Time from request start to first token received (in milliseconds)
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
  errorMessage?: string; // Added for logging errors
};

// Represents a single comparison run log entry
export type ComparisonLog = {
  id: string; // Unique ID for the log entry (e.g., 'comparison-1746186079143')
  timestamp: string; // ISO string timestamp of when the comparison completed
  duration: number; // Total duration of the comparison run in seconds
  prompt: string; // The prompt used for the comparison
  results: Array<{ // Array of results for each model in the comparison
    modelId: string;
    modelName: string;
    responseTime?: number; // ms
    tokensPerSecond?: number;
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    processingTime?: number; // seconds
    status: 'complete' | 'error'; // Status in the log
    errorMessage?: string;
  }>;
};
```