export interface RouteMetadata {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  structuredData?: Record<string, any>;
}

export interface RouteDefinition {
  path: string;
  ssr?: boolean;
  metadata?: RouteMetadata;
}

export const DEFAULT_ROUTE_METADATA: RouteMetadata = {
  title: "BotTailor - Smart AI Chatbots Made Simple",
  description:
    "Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform.",
  ogTitle: "BotTailor - Smart AI Chatbots Made Simple",
  ogDescription:
    "Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform.",
  ogImage: "https://bottailor.com/og-image.jpg",
  canonical: "https://bottailor.com/",
};

export function normalizeRoutePath(path: string): string {
  if (!path) {
    return "/";
  }

  const pathname = path.split("?")[0].split("#")[0];
  if (!pathname || pathname === "/") {
    return "/";
  }

  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return trimmed || "/";
}
