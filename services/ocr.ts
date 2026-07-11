import { demoMarks } from '@/data/demo';
import type { SubjectMark } from '@/types/models';

/**
 * OCR provider abstraction. The UI depends only on this interface,
 * so real report-card OCR can replace the mock without UI changes.
 */
export interface OCRProvider {
  extract(file: File): Promise<SubjectMark[]>;
}

const PROCESSING_DELAY_MS = 900;

/** Simulates OCR by returning the demo marks after a short delay. */
export class MockOCRProvider implements OCRProvider {
  async extract(file: File): Promise<SubjectMark[]> {
    void file;
    await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));
    return demoMarks;
  }
}

export const ocrProvider: OCRProvider = new MockOCRProvider();
