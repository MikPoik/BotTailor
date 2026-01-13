# Documentation for server/website-scanner.ts

import { chromium } from 'playwright'; // Temporarily disabled for initial implementation
Initialize OpenAI client
For now, use simpler content extraction without Playwright
Update progress in database every 5 pages or if it's a small site
Respectful delay between requests
Add the main URL to the set
Try to find and parse sitemap.xml
Update the websiteSource with sitemap URL if found
If no sitemap found or few URLs, try crawling the main page for links
Get all sitemaps from robots.txt, but filter out image sitemaps
Check if this is an image sitemap by content
Filter out image URLs and non-HTML pages
Invalid URL, skip
Check X-Robots-Tag header
Check for meta robots no-index tags
Remove scripts, styles, and other non-content elements
Extract main content
Filter out pages with very little content
Split content into chunks for better embedding
Generate embedding
Skip common image file extensions
Skip other non-content file types
Skip URLs that are clearly image-related
Invalid URL, skip it
Process text content directly for text/file sources
Update status to scanning
Split content into chunks for better embedding
Generate embedding
Update status and total pages processed
Update status to error