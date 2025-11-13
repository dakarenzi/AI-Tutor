/**
 * JSONFormatter.ts
 * 
 * Format structured JSON responses
 */

export class JSONFormatter {
  /**
   * Format response as JSON
   */
  static format(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Format error response
   */
  static formatError(error: Error | string): string {
    return JSON.stringify({
      error: error instanceof Error ? error.message : error,
      timestamp: Date.now(),
    });
  }
}



