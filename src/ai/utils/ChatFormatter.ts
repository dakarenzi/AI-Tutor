/**
 * ChatFormatter.ts
 * 
 * Format messages for chat display
 */

export class ChatFormatter {
  /**
   * Format message for chat display
   */
  static format(message: string): string {
    // Ensure proper formatting
    let formatted = message.trim();

    // Add line breaks for readability
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Ensure it ends properly
    if (!formatted.endsWith('.') && !formatted.endsWith('?') && !formatted.endsWith('!')) {
      formatted += '.';
    }

    return formatted;
  }

  /**
   * Format with markdown support
   */
  static formatMarkdown(message: string): string {
    return this.format(message);
  }
}



