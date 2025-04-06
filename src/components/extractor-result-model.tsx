export interface ExtractionResult {
    success: boolean;
    rawText: string;
    url?: string;
    title?: string;
    extractedFrom?: string | null;
    timestamp?: string;
    message?: string;
    error?: unknown;
  }