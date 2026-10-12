import { addDays } from 'date-fns';

/**
 * Spaced repetition: given a confidence level (1-5), returns the suggested
 * number of days until the next review. Higher confidence = longer interval.
 *
 * Based on a simplified Leitner-style schedule.
 */
export function suggestReviewDays(confidence: number): number {
  switch (confidence) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 4;
    case 4:
      return 7;
    case 5:
      return 14;
    default:
      return 1;
  }
}

export function suggestReviewDate(confidence: number): Date {
  return addDays(new Date(), suggestReviewDays(confidence));
}
