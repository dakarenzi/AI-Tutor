/**
 * TextCleaner.ts
 * 
 * Text sanitization
 */

export class TextCleaner {
  /**
   * Clean and sanitize text
   */
  static clean(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Remove control characters (except newlines and tabs)
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize line breaks
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return cleaned;
  }

  /**
   * Remove markdown if needed
   */
  static removeMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1') // Italic
      .replace(/`(.+?)`/g, '$1') // Code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Links
  }
}



