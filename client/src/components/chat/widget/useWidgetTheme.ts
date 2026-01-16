import { useEffect } from "react";

export const isLightColor = (color: string): boolean => {
  if (!color || !color.startsWith('#') || (color.length !== 7 && color.length !== 9)) {
    return true;
  }
  const hex = color.replace('#', '').slice(0, 6);
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export const getHeaderTextColor = (primary: string) => (
  isLightColor(primary) ? '#1f2937' : '#ffffff'
);

export function useApplyDocumentColors(resolvedBackgroundColor: string, resolvedTextColor: string, isClient: boolean, isEmbedded: boolean = false) {
  useEffect(() => {
    // Only apply document-level colors for embedded/full-page widget mode.
    if (!isClient || !isEmbedded) return;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyColor = document.body.style.color;
    const prevHtmlColor = document.documentElement.style.color;

    document.body.style.backgroundColor = resolvedBackgroundColor;
    document.documentElement.style.backgroundColor = resolvedBackgroundColor;
    document.body.style.color = resolvedTextColor;
    document.documentElement.style.color = resolvedTextColor;

    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.color = prevBodyColor;
      document.documentElement.style.color = prevHtmlColor;
    };
  }, [isClient, resolvedBackgroundColor, resolvedTextColor, isEmbedded]);
}

function buildViewportFixCSS() {
  return `
    /* Ensure fixed positioning is relative to viewport */
    html, body {
      transform: none !important;
      perspective: none !important;
      filter: none !important;
    }

    /* CRITICAL: Only target native widget containers, not iframe containers */
    body > div.font-sans[style*="position: fixed"] {
      position: fixed !important;
      will-change: transform !important;
      backface-visibility: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-sizing: border-box !important;
      min-width: 0 !important;
      max-width: none !important;
      overflow: visible !important;
    }

    /* Ensure bubble is always visible */
    div.font-sans[style*="position: fixed"][style*="bottom: 16px"] {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Specific rule for chat widget container */
    div.font-sans[style*="position: fixed"] {
      position: fixed !important;
      right: 16px !important;
      bottom: 16px !important;
      z-index: 40 !important;
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: none !important;
      filter: none !important;
      overflow: visible !important;
    }
  `;
}

function buildThemeCSS(primary: string, background: string, text: string, headerText: string, lightBackground: boolean) {
  return `
    .chat-widget-container {
      --chat-primary: ${primary};
      --chat-primary-color: ${primary};
      --chat-background: ${background};
      --chat-text: ${text};
      --foreground: ${text};
      --background: ${background};
      --border: ${lightBackground ? '#e2e8f0' : '#404040'};
      --input: ${lightBackground ? '#ffffff' : '#262626'};
      --muted: ${lightBackground ? '#f1f5f9' : '#2a2a2a'};
      --muted-foreground: ${lightBackground ? '#64748b' : '#a1a1aa'};
      --chat-header-text: ${headerText};
    }

    .chat-widget-container {
      --primary: ${primary};
      --primary-foreground: white;
      --ring: ${primary};
      --chat-bubble-bg: ${primary};
      --chat-user-bg: ${primary};
      --chat-hover: ${primary};
      --background: ${background};
      --foreground: ${text};
      --card: ${background};
      --card-foreground: ${text};
      --popover: ${background};
      --popover-foreground: ${text};
      --muted: ${lightBackground ? '#f1f5f9' : '#2a2a2a'};
      --muted-foreground: ${lightBackground ? '#64748b' : '#a1a1aa'};
      --border: ${lightBackground ? '#e2e8f0' : '#404040'};
      --input: ${lightBackground ? '#ffffff' : '#262626'};
      --accent: ${lightBackground ? '#f1f5f9' : '#262626'};
      --accent-foreground: ${text};
    }

    .chat-widget-container .chat-interface,
    .chat-widget-container .chat-interface-mobile {
      background-color: ${background} !important;
      color: ${text} !important;
    }

    .chat-widget-container .chat-message-bot,
    .chat-message-bot {
      background-color: ${lightBackground ? '#ffffff' : '#2a2a2a'} !important;
      color: ${text} !important;
      border-color: ${lightBackground ? '#e2e8f0' : '#404040'} !important;
    }

    .chat-widget-container .chat-message-user,
    .chat-message-user {
      background-color: ${primary}cc !important;
      color: white !important;
    }

    .chat-widget-container button[type="submit"],
    .chat-widget-container .send-button {
      background-color: ${primary} !important;
      border-color: ${primary} !important;
      color: white !important;
    }

    .chat-widget-container button.bg-primary,
    .chat-widget-container a.bg-primary,
    .chat-widget-container .btn-primary.bg-primary {
      background-color: ${primary} !important;
      color: white !important;
    }
    .chat-widget-container button.bg-primary:hover,
    .chat-widget-container a.bg-primary:hover,
    .chat-widget-container .btn-primary.bg-primary:hover,
    .chat-widget-container .hover\\:bg-primary\\/90:hover {
      background-color: ${primary}e6 !important;
    }

    .chat-widget-container .menu-option-button:hover {
      background-color: ${primary} !important;
      color: white !important;
    }

    .chat-widget-container input,
    .chat-widget-container textarea {
      background-color: ${lightBackground ? '#ffffff' : '#262626'} !important;
      color: ${text} !important;
      border-color: ${lightBackground ? '#e2e8f0' : '#404040'} !important;
    }
    .chat-widget-container input::placeholder,
    .chat-widget-container textarea::placeholder {
      color: ${lightBackground ? '#9ca3af' : '#6b7280'} !important;
    }
    .chat-widget-container input:focus,
    .chat-widget-container textarea:focus,
    .chat-widget-container select:focus {
      --tw-ring-color: ${primary} !important;
      border-color: ${primary} !important;
      box-shadow: 0 0 0 2px ${primary}40 !important;
    }

    .chat-widget-container .send-input {
      background-color: ${lightBackground ? '#ffffff' : '#262626'} !important;
      color: ${text} !important;
    }

    .chat-widget-container [data-radix-tabs-list] {
      background: ${background} !important;
      border-color: ${lightBackground ? '#e2e8f0' : '#404040'} !important;
    }
    .chat-widget-container [data-state="active"] {
      color: ${primary} !important;
      border-bottom-color: ${primary} !important;
    }
    .chat-widget-container [data-radix-tabs-trigger] {
      color: ${text} !important;
    }
    .chat-widget-container [data-radix-tabs-trigger][data-state="active"] {
      color: ${primary} !important;
    }

    .chat-widget-container .text-muted-foreground {
      color: ${lightBackground ? '#64748b' : '#a1a1aa'} !important;
    }
    .chat-widget-container .text-foreground {
      color: ${text} !important;
    }

    .chat-widget-container button:disabled,
    .chat-widget-container input:disabled,
    .chat-widget-container textarea:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }

    .chat-widget-container .bg-card {
      background-color: ${background} !important;
      color: ${text} !important;
    }

    .chat-widget-container .quick-reply-button {
      background-color: ${lightBackground ? '#f1f5f9' : '#2a2a2a'} !important;
      color: ${text} !important;
      border-color: ${lightBackground ? '#e2e8f0' : '#404040'} !important;
    }
    .chat-widget-container .quick-reply-button:hover {
      background-color: ${primary} !important;
      color: white !important;
    }

    .chat-widget-container .menu-option-button,
    .chat-widget-container button[class*="option"],
    .chat-widget-container button[class*="menu"] {
      background-color: ${lightBackground ? '#f1f5f9' : '#2a2a2a'} !important;
      color: ${text} !important;
      border-color: ${lightBackground ? '#e2e8f0' : '#404040'} !important;
      transition: all 0.2s ease !important;
    }
    .chat-widget-container .menu-option-button:hover,
    .chat-widget-container button[class*="option"]:hover,
    .chat-widget-container button[class*="menu"]:hover {
      background-color: ${primary} !important;
      color: white !important;
    }

    .chat-widget-container .border-primary { border-color: ${primary} !important; }
    .chat-widget-container .text-primary { color: ${primary} !important; }
    .chat-widget-container .hover\\:text-primary:hover { color: ${primary} !important; }

    .chat-widget-container .bg-muted { background-color: var(--muted) !important; }
    .chat-widget-container .bg-accent { background-color: var(--accent) !important; }
    .chat-widget-container .text-muted-foreground { color: var(--muted-foreground) !important; }
    .chat-widget-container .text-foreground { color: var(--foreground) !important; }

    .chat-widget-container .chat-header h1,
    .chat-widget-container .chat-header h2,
    .chat-widget-container .chat-header h3,
    .chat-widget-container .chat-header h4,
    .chat-widget-container .chat-header h5,
    .chat-widget-container .chat-header h6 {
      color: var(--chat-header-text) !important;
    }

    .chat-widget-container .border-border { border-color: var(--border) !important; }
    .chat-widget-container .bg-background { background-color: var(--background) !important; }
    .chat-widget-container .bg-card { background-color: var(--card) !important; color: var(--card-foreground) !important; }

    .chat-widget-container [class*="border-neutral"] { border-color: var(--border) !important; }
    .chat-widget-container [class*="bg-neutral"] { background-color: var(--muted) !important; color: var(--foreground) !important; }
    .chat-widget-container [class*="text-neutral"] { color: var(--foreground) !important; }

    .chat-widget-container .focus-visible\\:ring-ring:focus-visible { --tw-ring-color: ${primary} !important; }
    .chat-widget-container ::selection { background-color: ${primary}40 !important; }

    .chat-widget-embedded { opacity: 1 !important; transform: none !important; }
    .chat-widget-embedded.closing { animation: chatWidgetEmbedClose 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards !important; }
    @keyframes chatWidgetEmbedClose { from { opacity: 1; transform: scale(1) translateY(0);} to { opacity: 0; transform: scale(0.95) translateY(10px);} }

    .chat-widget-embedded button,
    .chat-widget-embedded input,
    .chat-widget-embedded a {
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease !important;
    }
  `;
}

export function useInjectChatTheme(primary: string, background: string, text: string, isEmbedded: boolean = false) {
  useEffect(() => {
    const themeKey = `${primary}-${background}-${text}-${isEmbedded}`;
    const currentThemeKey = document.documentElement.getAttribute('data-chat-theme-key');
    if (currentThemeKey === themeKey) return;

    // Only inject the viewport/global fixes when running as an embedded full-page widget.
    if (isEmbedded && !document.getElementById('chat-widget-viewport-fix')) {
      const viewportFix = document.createElement('style');
      viewportFix.id = 'chat-widget-viewport-fix';
      viewportFix.textContent = buildViewportFixCSS();
      document.head.appendChild(viewportFix);
    }

    const isLightBackground = isLightColor(background);
    const headerTextColor = getHeaderTextColor(primary);

    const existingStyle = document.getElementById('chat-widget-theme-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'chat-widget-theme-styles';
    style.textContent = buildThemeCSS(primary, background, text, headerTextColor, isLightBackground);
    document.head.appendChild(style);

    document.documentElement.setAttribute('data-chat-theme-key', themeKey);

    return () => {
      const el = document.getElementById('chat-widget-theme-styles');
      if (el && !document.documentElement.getAttribute('data-chat-theme-key')) {
        el.remove();
      }
    };
  }, [primary, background, text, isEmbedded]);
}
