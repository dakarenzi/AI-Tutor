/**
 * MessageSplitter.ts
 * 
 * Chunk long messages for mobile
 */

export class MessageSplitter {
  /**
   * Split message into chunks
   */
  static split(message: string, maxChunkSize: number = 500): string[] {
    if (message.length <= maxChunkSize) {
      return [message];
    }

    const chunks: string[] = [];
    const sentences = message.split(/(?<=[.!?])\s+/);

    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split preserving paragraphs
   */
  static splitByParagraphs(message: string, maxChunkSize: number = 500): string[] {
    const paragraphs = message.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}



