// Shared markdown parsing utility
export function parseMarkdown(text: string): string {
  // First, clean up any incomplete HTML tags
  let cleanedText = text
    // Remove incomplete HTML tags (anything that starts with < but doesn't close properly)
    .replace(/<[^>]*$/g, '')
    // Remove orphaned closing tags
    .replace(/^[^<]*>/g, '')
    // Clean up malformed anchor tags
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*?)(?:<\/a>)?$/gi, '[$2]($1)');

  return cleanedText
    // Bold text: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Markdown links: [text](url) - process before auto-URL detection
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>')
    // Auto-detect URLs (http/https) - but avoid double-processing already linked URLs
    .replace(/(?<!href=")(?<!">)(https?:\/\/[^\s<>"]+)(?![^<]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');
}