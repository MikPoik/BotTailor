// import { chromium } from 'playwright'; // Temporarily disabled for initial implementation
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import OpenAI from 'openai';
import { storage } from './storage';
import { WebsiteSource, InsertWebsiteContent } from '@shared/schema';

// Initialize OpenAI client
let openai: OpenAI;

function initializeOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface ScanResult {
  success: boolean;
  message: string;
  pagesScanned?: number;
  error?: string;
}

export class WebsiteScanner {
  private maxPages: number = 50;
  private delay: number = 1000; // 1 second delay between requests

  async scanWebsite(websiteSourceId: number): Promise<ScanResult> {
    try {
      const websiteSource = await storage.getWebsiteSource(websiteSourceId);
      if (!websiteSource) {
        return { success: false, message: 'Website source not found' };
      }

      await storage.updateWebsiteSource(websiteSourceId, { 
        status: 'scanning',
        lastScanned: new Date()
      });

      const urls = await this.discoverUrls(websiteSource);
      console.log(`Discovered ${urls.length} URLs for ${websiteSource.url}`);

      let scannedCount = 0;

      // For now, use simpler content extraction without Playwright
      for (const url of urls.slice(0, websiteSource.maxPages || this.maxPages)) {
        try {
          const content = await this.extractContentSimple(url);
          if (content) {
            await this.processAndStore(websiteSourceId, url, content);
            scannedCount++;
          }
          
          // Respectful delay between requests
          await new Promise(resolve => setTimeout(resolve, this.delay));
        } catch (error) {
          console.error(`Error scanning ${url}:`, error);
          continue;
        }
      }

      const updateResult = await storage.updateWebsiteSource(websiteSourceId, {
        status: 'completed',
        totalPages: scannedCount,
        lastScanned: new Date()
      });

      console.log(`✅ Scan completed for source ${websiteSourceId}: ${scannedCount} pages, status updated to completed`);

      return {
        success: true,
        message: `Successfully scanned ${scannedCount} pages`,
        pagesScanned: scannedCount
      };

    } catch (error) {
      console.error('Website scanning error:', error);
      await storage.updateWebsiteSource(websiteSourceId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to scan website',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async discoverUrls(websiteSource: WebsiteSource): Promise<string[]> {
    const urls = new Set<string>();
    const baseUrl = new URL(websiteSource.url);
    
    // Start with the provided URL
    urls.add(websiteSource.url);

    try {
      // Try to find and parse sitemap.xml
      const sitemapUrls = await this.findSitemap(baseUrl.origin);
      sitemapUrls.forEach(url => urls.add(url));
      
      // Update the websiteSource with sitemap URL if found
      if (sitemapUrls.length > 0 && !websiteSource.sitemapUrl) {
        await storage.updateWebsiteSource(websiteSource.id, {
          sitemapUrl: `${baseUrl.origin}/sitemap.xml`
        });
      }
    } catch (error) {
      console.error('Error finding sitemap:', error);
    }

    // If no sitemap found or few URLs, try crawling the main page for links
    if (urls.size < 5) {
      try {
        const crawledUrls = await this.crawlPageLinks(websiteSource.url, baseUrl.origin);
        crawledUrls.forEach(url => urls.add(url));
      } catch (error) {
        console.error('Error crawling page links:', error);
      }
    }

    return Array.from(urls);
  }

  private async findSitemap(baseUrl: string): Promise<string[]> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/robots.txt`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        // Use dynamic import for fetch polyfill in case Node.js version doesn't have it
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          const content = await response.text();
          
          if (sitemapUrl.endsWith('robots.txt')) {
            const sitemapMatch = content.match(/Sitemap:\s*(.+)/i);
            if (sitemapMatch) {
              return await this.parseSitemap(sitemapMatch[1].trim());
            }
          } else {
            return await this.parseSitemap(sitemapUrl);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${sitemapUrl}:`, error);
      }
    }

    return [];
  }

  private async parseSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(sitemapUrl);
      if (!response.ok) return [];

      const xmlContent = await response.text();
      const parsed = await parseStringPromise(xmlContent);

      const urls: string[] = [];

      if (parsed.urlset?.url) {
        for (const url of parsed.urlset.url) {
          if (url.loc?.[0]) {
            urls.push(url.loc[0]);
          }
        }
      }

      if (parsed.sitemapindex?.sitemap) {
        for (const sitemap of parsed.sitemapindex.sitemap) {
          if (sitemap.loc?.[0]) {
            const nestedUrls = await this.parseSitemap(sitemap.loc[0]);
            urls.push(...nestedUrls);
          }
        }
      }

      return urls;
    } catch (error) {
      console.error('Error parsing sitemap:', error);
      return [];
    }
  }

  private async crawlPageLinks(url: string, baseOrigin: string): Promise<string[]> {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url);
      if (!response.ok) return [];

      const html = await response.text();
      const $ = cheerio.load(html);
      const links = new Set<string>();

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url);
            if (absoluteUrl.origin === baseOrigin && 
                !absoluteUrl.pathname.includes('#') &&
                !absoluteUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/i)) {
              links.add(absoluteUrl.toString());
            }
          } catch (error) {
            // Invalid URL, skip
          }
        }
      });

      return Array.from(links);
    } catch (error) {
      console.error('Error crawling page links:', error);
      return [];
    }
  }

  private async extractContentSimple(url: string): Promise<{ title: string; content: string } | null> {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatbotScanner/1.0)',
        },
        timeout: 10000,
      });

      if (!response.ok) {
        console.error(`HTTP ${response.status} for ${url}`);
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove scripts, styles, and other non-content elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();

      const title = $('title').text() || $('h1').first().text() || '';
      
      // Extract main content
      const mainContent = $('main, article, .content, .post, #content, #main').first();
      const content = mainContent.length > 0 ? mainContent.text() : $('body').text();
      
      const cleanContent = content.replace(/\s+/g, ' ').trim();

      // Filter out pages with very little content
      if (cleanContent.length < 100) {
        return null;
      }

      return {
        title: title.trim(),
        content: cleanContent
      };
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      return null;
    }
  }

  private async processAndStore(websiteSourceId: number, url: string, content: { title: string; content: string }) {
    try {
      // Split content into chunks for better embedding
      const chunks = this.splitIntoChunks(content.content, 1000);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding
        const embedding = await this.generateEmbedding(chunk);
        
        const contentData: InsertWebsiteContent = {
          websiteSourceId,
          url,
          title: i === 0 ? content.title : `${content.title} (Part ${i + 1})`,
          content: chunk,
          contentType: 'text',
          wordCount: chunk.split(/\s+/).length,
        };

        await storage.createWebsiteContent(contentData, JSON.stringify(embedding));
      }
    } catch (error) {
      console.error('Error processing and storing content:', error);
    }
  }

  private splitIntoChunks(text: string, maxLength: number): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const client = initializeOpenAI();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
}