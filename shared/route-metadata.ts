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

export const routeMetadata: Record<string, RouteMetadata> = {
  "/": {
    title: "BotTailor - Smart AI Chatbots Made Simple | Create Custom AI Assistants",
    description: "Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform. No coding required - start free today!",
    keywords: "AI chatbot, custom chatbot, website chatbot, AI assistant, chatbot builder, conversational AI, customer support bot, lead generation chatbot",
    ogTitle: "BotTailor - Smart AI Chatbots Made Simple",
    ogDescription: "Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform.",
    ogImage: "https://bottailor.com/og-image.jpg",
    canonical: "https://bottailor.com/",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "BotTailor",
      "description": "Create intelligent, customizable AI chatbots for your website in minutes",
      "url": "https://bottailor.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free tier available"
      },
      "creator": {
        "@type": "Organization",
        "name": "BotTailor",
        "url": "https://bottailor.com"
      }
    }
  },
  "/docs": {
    title: "Documentation - BotTailor | Complete Guide to AI Chatbot Creation",
    description: "Complete guide to creating, customizing, and deploying AI chatbots with BotTailor. Learn embedding, configuration, and best practices.",
    keywords: "chatbot documentation, AI chatbot guide, BotTailor docs, chatbot setup, embedding guide",
    ogTitle: "Documentation - BotTailor",
    ogDescription: "Complete guide to creating, customizing, and deploying AI chatbots with BotTailor.",
    ogImage: "https://bottailor.com/og-docs.jpg",
    canonical: "https://bottailor.com/docs"
  },
  "/pricing": {
    title: "Pricing - BotTailor | Affordable AI Chatbot Plans",
    description: "Choose the perfect AI chatbot plan for your business. Flexible pricing with powerful features starting free.",
    keywords: "chatbot pricing, AI chatbot plans, BotTailor cost, chatbot subscription",
    ogTitle: "Pricing - BotTailor",
    ogDescription: "Choose the perfect AI chatbot plan for your business. Flexible pricing with powerful features starting free.",
    ogImage: "https://bottailor.com/og-pricing.jpg",
    canonical: "https://bottailor.com/pricing"
  },
  "/contact": {
    title: "Contact Us - BotTailor | Get Help with AI Chatbots",
    description: "Get in touch with our team for support, questions, or custom chatbot solutions. We're here to help you succeed.",
    keywords: "contact BotTailor, chatbot support, AI chatbot help, customer service",
    ogTitle: "Contact Us - BotTailor",
    ogDescription: "Get in touch with our team for support, questions, or custom chatbot solutions.",
    ogImage: "https://bottailor.com/og-contact.jpg",
    canonical: "https://bottailor.com/contact"
  },
  "/privacy": {
    title: "Privacy Policy - BotTailor | Your Data Protection",
    description: "Learn how BotTailor protects your privacy and handles your data. Transparent privacy practices for AI chatbot services.",
    keywords: "privacy policy, data protection, BotTailor privacy, chatbot privacy",
    ogTitle: "Privacy Policy - BotTailor",
    ogDescription: "Learn how BotTailor protects your privacy and handles your data.",
    ogImage: "https://bottailor.com/og-privacy.jpg",
    canonical: "https://bottailor.com/privacy"
  },
  "/terms": {
    title: "Terms of Service - BotTailor | Service Agreement",
    description: "Read our terms of service for using BotTailor AI chatbot platform. Clear guidelines for our service usage.",
    keywords: "terms of service, service agreement, BotTailor terms, chatbot terms",
    ogTitle: "Terms of Service - BotTailor",
    ogDescription: "Read our terms of service for using BotTailor AI chatbot platform.",
    ogImage: "https://bottailor.com/og-terms.jpg",
    canonical: "https://bottailor.com/terms"
  }
};

export function getRouteMetadata(path: string): RouteMetadata {
  return routeMetadata[path] || routeMetadata["/"];
}

// Routes that should be server-side rendered
export const SSR_ROUTES = ["/", "/docs", "/pricing", "/contact", "/privacy", "/terms"];

export function isSSRRoute(path: string): boolean {
  return SSR_ROUTES.includes(path);
}