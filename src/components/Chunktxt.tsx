/**
 * Splits a long string into smaller chunks.
 *
 * @param text       The text to chunk
 * @param chunkSize  The maximum size of each chunk (in characters or tokens)
 * @returns An array of string chunks
 */
export function chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;
  
    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      chunks.push(text.slice(startIndex, endIndex));
      startIndex = endIndex;
    }
  
    return chunks;
  }
  