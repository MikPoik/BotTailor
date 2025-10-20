
import { normalizeRoutePath, type RouteMetadata } from "@shared/route-metadata";
import { getRouteMetadata } from "@/routes/registry";

/**
 * Updates the document metadata (title, meta tags) on the client side
 * Used for CSR pages that don't have SSR enabled
 */
export function updateClientMetadata(pathname: string) {
  const normalizedPath = normalizeRoutePath(pathname);
  const metadata = getRouteMetadata(normalizedPath);

  if (!metadata) {
    console.warn(`No metadata found for route: ${normalizedPath}`);
    return;
  }

  // Update title
  if (metadata.title) {
    document.title = metadata.title;
  }

  // Helper to update or create meta tag
  const updateMetaTag = (selector: string, content: string) => {
    let element = document.querySelector(selector) as HTMLMetaElement;
    if (!element) {
      element = document.createElement("meta");
      const [attr, value] = selector.match(/\[(.+?)=["'](.+?)["']\]/)?.slice(1) || [];
      if (attr && value) {
        element.setAttribute(attr, value);
      }
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  // Update description
  if (metadata.description) {
    updateMetaTag('meta[name="description"]', metadata.description);
  }

  // Update keywords
  if (metadata.keywords) {
    updateMetaTag('meta[name="keywords"]', metadata.keywords);
  }

  // Update Open Graph tags
  if (metadata.ogTitle) {
    updateMetaTag('meta[property="og:title"]', metadata.ogTitle);
  }

  if (metadata.ogDescription) {
    updateMetaTag('meta[property="og:description"]', metadata.ogDescription);
  }

  if (metadata.ogImage) {
    updateMetaTag('meta[property="og:image"]', metadata.ogImage);
  }

  // Update canonical URL
  if (metadata.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", metadata.canonical);
  }

  // Update Twitter Card tags
  if (metadata.ogTitle) {
    updateMetaTag('meta[name="twitter:title"]', metadata.ogTitle);
  }

  if (metadata.ogDescription) {
    updateMetaTag('meta[name="twitter:description"]', metadata.ogDescription);
  }

  if (metadata.ogImage) {
    updateMetaTag('meta[name="twitter:image"]', metadata.ogImage);
  }
}

/**
 * React hook to update metadata on route changes for CSR pages
 */
export function useClientMetadata(pathname: string) {
  if (typeof window === "undefined") {
    return; // Skip on server
  }

  updateClientMetadata(pathname);
}
