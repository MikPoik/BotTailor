(function() {
  'use strict';

  // Chatbot Widget Embedder
  const ChatWidget = {
    config: {
      apiUrl: null, // Must be provided
      sessionId: null,
      position: 'bottom-right',
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      zIndex: 1000,
    },
    _initialized: false,

    init: function(options = {}) {
      // Prevent multiple initializations (unless we're resetting)
      if (this._initialized && !options._forceReinit) {
        return;
      }

      // Merge options with default config
      this.config = { ...this.config, ...options };

      // Validate required config - STRICT validation, no fallbacks
      if (!this.config.apiUrl) {
        console.error('Chat widget: apiUrl is required but not provided');
        return;
      }

      // Validate that the API URL includes the proper /widget/ path for external embeds
      // This prevents the widget from showing when accessed through incorrect URLs
      if (!this.config.apiUrl.includes('/widget/')) {
        console.error('Chat widget: API URL must include /widget/ path for proper functionality');
        return;
      }

      // Session ID will be generated server-side if not provided
      // We'll let the server handle generation when the iframe loads

      this._initialized = true;

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.loadStylesAndCreateWidget();
        });
      } else {
        this.loadStylesAndCreateWidget();
      }
    },

    loadStylesAndCreateWidget: function() {
      // Check if styles are already loaded
      if (document.getElementById('chatwidget-styles')) {
        this.createWidget();
        this.setupEventListeners();
        return;
      }

      // Load CSS file
      const link = document.createElement('link');
      link.id = 'chatwidget-styles';
      link.rel = 'stylesheet';
      link.type = 'text/css';

      // Determine the CSS URL based on the API URL
      let baseUrl;
      try {
        if (this.config.apiUrl.includes('/widget/')) {
          baseUrl = this.config.apiUrl.split('/widget/')[0];
        } else {
          // Extract base URL from full API URL
          const url = new URL(this.config.apiUrl);
          baseUrl = `${url.protocol}//${url.host}`;
        }
      } catch (error) {
        // Fallback to current origin if URL parsing fails
        baseUrl = window.location.origin;
      }

      // Force HTTPS for CSS loading
      baseUrl = this.forceHttps(baseUrl);
      link.href = `${baseUrl}/embed.css`;

      // Wait for CSS to load before creating widget
      link.onload = () => {
        this.createWidget();
        this.setupEventListeners();
      };

      // Fallback in case CSS fails to load
      link.onerror = () => {
        console.warn('Chat widget CSS failed to load, creating widget without styles');
        this.createWidget();
        this.setupEventListeners();
      };

      // Timeout fallback (in case onload never fires)
      setTimeout(() => {
        if (!document.getElementById('chatwidget-container')) {
          this.createWidget();
          this.setupEventListeners();
        }
      }, 2000);

      document.head.appendChild(link);
    },

    loadStyles: function() {
      // Kept for backward compatibility - this method is now part of loadStylesAndCreateWidget
      this.loadStylesAndCreateWidget();
    },

    generateSessionId: function() {
      return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Safe sessionStorage access that handles sandboxed environments
    safeSessionStorage: {
      getItem: function(key) {
        try {
          return sessionStorage.getItem(key);
        } catch (error) {
          console.warn('sessionStorage not accessible in embed, using session-based fallback');
          return null;
        }
      },
      setItem: function(key, value) {
        try {
          sessionStorage.setItem(key, value);
        } catch (error) {
          console.warn('sessionStorage not accessible in embed, skipping storage');
        }
      },
      removeItem: function(key) {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn('sessionStorage not accessible in embed, skipping removal');
        }
      }
    },

    // Generate or retrieve session ID from sessionStorage
    getOrCreateSessionId: function() {
      // If sessionId is provided in config, use it (for server-side injection)
      if (this.config.sessionId) {
        return this.config.sessionId;
      }

      // Try to get existing sessionId from sessionStorage
      const storageKey = 'embed-session-id';
      const storedSessionId = this.safeSessionStorage.getItem(storageKey);

      if (storedSessionId) {
        console.log('[EMBED] Retrieved session ID from storage:', storedSessionId);
        return storedSessionId;
      }

      // Generate new sessionId and store it
      const newSessionId = this.generateSessionId();
      this.safeSessionStorage.setItem(storageKey, newSessionId);
      console.log('[EMBED] Generated and stored new session ID:', newSessionId);
      return newSessionId;
    },

    injectThemeVariables: function() {
      // Inject CSS variables for theme support
      if (!this.config.primaryColor && !this.config.backgroundColor && !this.config.textColor) {
        return; // No theme customization needed
      }

      // Check if we already injected the styles
      if (document.getElementById('chatwidget-theme-vars')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'chatwidget-theme-vars';

      // Determine appropriate muted and border colors based on background
      const backgroundColor = this.config.backgroundColor || '#ffffff';
      const isDarkBackground = backgroundColor !== '#ffffff' && backgroundColor !== '#fff';

      const mutedColor = isDarkBackground ? '#2a2a2a' : '#f1f5f9';
      const mutedForegroundColor = isDarkBackground ? '#a1a1aa' : '#64748b';
      const borderColor = isDarkBackground ? '#404040' : '#e2e8f0';
      const inputColor = isDarkBackground ? '#262626' : '#ffffff';
      const accentColor = isDarkBackground ? '#262626' : '#f1f5f9';

      style.textContent = `
        :root {
          --chat-primary-color: ${this.config.primaryColor || '#2563eb'};
          --chat-primary-color-alpha-80: ${this.config.primaryColor || '#2563eb'}cc;
          --chat-primary-color-alpha-90: ${this.config.primaryColor || '#2563eb'}e6;
          --chat-primary-color-alpha-25: ${this.config.primaryColor || '#2563eb'}40;
          --chat-user-bg: ${this.config.primaryColor || '#2563eb'}cc;
          --chat-background: ${backgroundColor};
          --chat-text: ${this.config.textColor || '#1f2937'};
          --chat-muted: ${mutedColor};
          --chat-muted-foreground: ${mutedForegroundColor};
          --chat-border: ${borderColor};
          --chat-input: ${inputColor};
          --chat-accent: ${accentColor};
        }
      `;

      document.head.appendChild(style);
    },

    createWidget: function() {
      // Inject CSS variables for theme support
      this.injectThemeVariables();

      // Create iframe container
      const container = document.createElement('div');
      container.id = 'chatwidget-container';
      container.className = `chatwidget-container ${this.config.position}`;
      container.style.zIndex = this.config.zIndex;

      // Add initial positioning styles to prevent FOUC
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      container.style.display = 'none'; // Hide by default until we confirm chatbot is active
      if (this.config.position === 'bottom-right') {
        container.style.right = '24px';
      } else {
        container.style.left = '24px';
      }

      // Create initial message bubble
      const messageBubble = document.createElement('div');
      messageBubble.id = 'chatwidget-message-bubble';
      messageBubble.className = `chatwidget-message-bubble ${this.config.position}`;

      // Add initial styles to prevent FOUC
      messageBubble.style.position = 'absolute';
      messageBubble.style.bottom = '80px';
      messageBubble.style.maxWidth = '350px';
      messageBubble.style.background = 'transparent';
      messageBubble.style.borderRadius = '16px';
      messageBubble.style.padding = '8px';
      messageBubble.style.transform = 'translateY(10px) scale(0.95)';
      messageBubble.style.opacity = '0';
      messageBubble.style.visibility = 'hidden';
      messageBubble.style.transition = 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
      if (this.config.position === 'bottom-right') {
        messageBubble.style.right = '0';
      } else {
        messageBubble.style.left = '0';
      }

      // Message bubble content - simplified to show only text
      messageBubble.innerHTML = `
        <div class="chatwidget-message-content" style="display: flex; align-items: flex-start; gap: 12px;">
          <div class="chatwidget-speech-bubble" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; margin-bottom: 6px; position: relative; min-width: 200px; max-width: 280px; word-wrap: break-word;">
            <p class="chatwidget-message-main" style="margin: 0; color: #333; line-height: 1.4;">Hello there! Need any help?</p>
          </div>
          <button id="chatwidget-message-close" class="chatwidget-close-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #666;">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <!-- Arrow pointing to chat bubble -->
        <div class="chatwidget-arrow" style="position: absolute; bottom: -8px; ${this.config.position === 'bottom-right' ? 'right' : 'left'}: 24px; width: 16px; height: 16px; background: #ffffff; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; transform: rotate(45deg);"></div>
      `;

      // Create chat bubble
      const bubble = document.createElement('div');
      bubble.id = 'chatwidget-bubble';
      bubble.className = 'chatwidget-bubble';
      bubble.style.backgroundColor = this.config.primaryColor;

      // Add initial styles to prevent FOUC
      bubble.style.width = '56px';
      bubble.style.height = '56px';
      bubble.style.borderRadius = '50%';
      bubble.style.display = 'flex';
      bubble.style.alignItems = 'center';
      bubble.style.justifyContent = 'center';
      bubble.style.cursor = 'pointer';
      bubble.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
      bubble.style.border = `1px solid ${this.config.primaryColor || '#2563eb'}cc`;
      bubble.style.transition = 'all 0.3s ease';

      bubble.innerHTML = `
        <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.24 0-2.43-.18-3.53-.5L3 21l1.5-5.47C4.18 14.43 4 13.24 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
          <circle cx="8" cy="12" r="1"/>
          <circle cx="12" cy="12" r="1"/>
          <circle cx="16" cy="12" r="1"/>
        </svg>
      `;

      // Create notification badge
      const badge = document.createElement('div');
      badge.id = 'chatwidget-badge';
      badge.className = 'chatwidget-badge';
      badge.textContent = '1';

      // Add initial styles to prevent FOUC
      badge.style.position = 'absolute';
      badge.style.top = '-6px';
      badge.style.right = '-6px';
      badge.style.width = '20px';
      badge.style.height = '20px';
      badge.style.borderRadius = '50%';
      badge.style.background = '#ef4444';
      badge.style.color = 'white';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = 'bold';
      badge.style.display = 'none';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.border = '2px solid white';

      bubble.appendChild(badge);

      // Create iframe placeholder for chat interface (lazy load)
      const iframe = document.createElement('iframe');
      iframe.id = 'chatwidget-iframe';
      iframe.className = 'chatwidget-iframe';
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');

      // Add initial styles to prevent white screen during transitions
      iframe.style.width = '550px';
      iframe.style.height = '85vh';
      iframe.style.maxHeight = '900px';
      iframe.style.minHeight = '700px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.position = 'fixed';
      iframe.style.bottom = '8px';
      iframe.style.backgroundColor = 'transparent';
      iframe.style.visibility = 'hidden';
      iframe.style.transition = 'all 0.3s ease-out';
      iframe.style.zIndex = this.config.zIndex;
      if (this.config.position === 'bottom-right') {
        iframe.style.right = '8px';
      } else {
        iframe.style.left = '8px';
      }

      // Mobile overlay for small screens
      const overlay = document.createElement('div');
      overlay.id = 'chatwidget-overlay';
      overlay.className = 'chatwidget-overlay';

      // Add initial styles to prevent visual glitches
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.display = 'none';
      overlay.style.zIndex = this.config.zIndex - 1;

      // Mobile iframe placeholder (lazy load)
      const mobileIframe = document.createElement('iframe');
      mobileIframe.id = 'chatwidget-mobile-iframe';
      mobileIframe.className = 'chatwidget-mobile-iframe';
      mobileIframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');

      // Add initial styles to prevent white screen during transitions
      mobileIframe.style.position = 'fixed';
      mobileIframe.style.top = '0';
      mobileIframe.style.left = '0';
      mobileIframe.style.width = '100%';
      mobileIframe.style.height = '100%';
      mobileIframe.style.border = 'none';
      mobileIframe.style.backgroundColor = 'transparent';
      mobileIframe.style.visibility = 'hidden';
      mobileIframe.style.transition = 'all 0.3s ease-out';
      mobileIframe.style.zIndex = this.config.zIndex;

      container.appendChild(messageBubble);
      container.appendChild(bubble);
      container.appendChild(iframe);
      document.body.appendChild(overlay);
      document.body.appendChild(mobileIframe);
      document.body.appendChild(container);

      // Fetch and display initial messages or show default
      this.loadInitialMessages(messageBubble);

      // Add CSS animations
      this.addAnimations();
    },

    addAnimations: function() {
      if (document.getElementById('chatwidget-animations')) return;

      const style = document.createElement('style');
      style.id = 'chatwidget-animations';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(10px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .chatwidget-bubble:hover {
          transform: scale(1.05);
          animation: none;
        }

        .chatwidget-iframe.show {
          display: block !important;
          animation: fadeIn 0.3s ease-out;
        }

        .chatwidget-mobile-iframe.show {
          display: block !important;
          animation: slideUp 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
    },

    setupEventListeners: function() {
      const bubble = document.getElementById('chatwidget-bubble');
      const iframe = document.getElementById('chatwidget-iframe');
      const overlay = document.getElementById('chatwidget-overlay');
      const mobileIframe = document.getElementById('chatwidget-mobile-iframe');
      const badge = document.getElementById('chatwidget-badge');
      const messageBubble = document.getElementById('chatwidget-message-bubble');
      const messageClose = document.getElementById('chatwidget-message-close');

      let isOpen = false;
      let messageVisible = true;

      const isMobile = () => window.innerWidth < 1024;

      const openChat = () => {
        isOpen = true;
        badge.style.display = 'none';

        // Hide message bubble when chat opens
        if (messageVisible && messageBubble) {
          messageBubble.classList.remove('visible');
          messageVisible = false;
        }

        // Hide all initial message bubbles when chat opens
        ChatWidget.hideAllInitialMessages();

        if (isMobile()) {
          // Only load iframe once to preserve chat session
          if (!mobileIframe.src) {
            try {
              // Build optimized iframe URL with persistent sessionId - theme colors passed via postMessage after load
              const sessionId = this.getOrCreateSessionId();
              let widgetUrl;
              if (this.config.apiUrl.includes('/widget/')) {
                // Specific widget URL - use as-is with minimal parameters
                const separator = this.config.apiUrl.includes('?') ? '&' : '?';
                widgetUrl = `${this.config.apiUrl}${separator}embedded=true&mobile=true&sessionId=${encodeURIComponent(sessionId)}`;
              } else {
                // Base URL - append /chat-widget path
                widgetUrl = `${this.config.apiUrl}/chat-widget?embedded=true&mobile=true&sessionId=${encodeURIComponent(sessionId)}`;
              }

              // Force HTTPS for iframe URL
              mobileIframe.src = this.forceHttps(widgetUrl);

              // Send theme configuration after iframe loads
              mobileIframe.onload = () => {
                if (mobileIframe.contentWindow) {
                  mobileIframe.contentWindow.postMessage({
                    type: 'THEME_CONFIG',
                    theme: {
                      primaryColor: this.config.primaryColor || '#2563eb',
                      backgroundColor: this.config.backgroundColor || '#ffffff',
                      textColor: this.config.textColor || '#1f2937'
                    }
                  }, '*');
                }
              };
            } catch (error) {
              // Fallback URL construction
              mobileIframe.src = this.forceHttps(`${this.config.apiUrl}?embedded=true&mobile=true`);
            }
          }
          bubble.style.display = 'none';
          overlay.style.display = 'block';
          mobileIframe.style.visibility = 'visible';
          mobileIframe.style.display = 'block';
          mobileIframe.classList.add('show');
        } else {
          // Only load iframe once to preserve chat session
          if (!iframe.src) {
            try {
              // Build optimized iframe URL with persistent sessionId - theme colors passed via postMessage after load
              const sessionId = this.getOrCreateSessionId();
              let widgetUrl;
              if (this.config.apiUrl.includes('/widget/')) {
                // Specific widget URL - use as-is with minimal parameters
                const separator = this.config.apiUrl.includes('?') ? '&' : '?';
                widgetUrl = `${this.config.apiUrl}${separator}embedded=true&sessionId=${encodeURIComponent(sessionId)}`;
              } else {
                // Base URL - append /chat-widget path
                widgetUrl = `${this.config.apiUrl}/chat-widget?embedded=true&sessionId=${encodeURIComponent(sessionId)}`;
              }

              // Force HTTPS for iframe URL
              iframe.src = this.forceHttps(widgetUrl);

              // Send theme configuration after iframe loads
              iframe.onload = () => {
                if (iframe.contentWindow) {
                  iframe.contentWindow.postMessage({
                    type: 'THEME_CONFIG',
                    theme: {
                      primaryColor: this.config.primaryColor || '#2563eb',
                      backgroundColor: this.config.backgroundColor || '#ffffff',
                      textColor: this.config.textColor || '#1f2937'
                    }
                  }, '*');
                }
              };
            } catch (error) {
              // Fallback URL construction
              iframe.src = this.forceHttps(`${this.config.apiUrl}?embedded=true`);
            }
          }
          bubble.style.display = 'none';
          iframe.style.visibility = 'visible';
          iframe.style.display = 'block';
          iframe.classList.add('show');
        }
      };

      const closeChat = () => {
        isOpen = false;

        if (isMobile()) {
          // Send close message to iframe for internal animation handling
          if (mobileIframe.contentWindow) {
            mobileIframe.contentWindow.postMessage({ type: 'CLOSE_CHAT' }, '*');
          }

          // Trigger smooth closing animation
          mobileIframe.classList.add('closing');
          mobileIframe.classList.remove('show');
          setTimeout(() => {
            overlay.style.display = 'none';
            mobileIframe.style.visibility = 'hidden';
            mobileIframe.classList.remove('closing');
          }, 300); // Match animation duration
        } else {
          // Send close message to iframe for internal animation handling
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'CLOSE_CHAT' }, '*');
          }

          // Trigger smooth closing animation
          iframe.classList.add('closing');
          iframe.classList.remove('show');
          setTimeout(() => {
            iframe.style.visibility = 'hidden';
            iframe.classList.remove('closing');
          }, 800); // Match animation duration
        }

        bubble.style.display = 'flex';
      };

      // Close message bubble function
      const closeMessageBubble = () => {
        if (messageBubble && messageVisible) {
          messageBubble.classList.remove('visible');
          messageVisible = false;
          
          // Mark default message as dismissed
          const chatbotId = this.config.chatbotConfig?.id || 'default';
          const dismissedKey = `chat-default-message-dismissed-${chatbotId}`;
          this.safeSessionStorage.setItem(dismissedKey, 'true');
        }
      };

      // Event listeners
      bubble.addEventListener('click', openChat);
      overlay.addEventListener('click', closeChat);
      if (messageClose) {
        messageClose.addEventListener('click', closeMessageBubble);
      }
      if (messageBubble) {
        // Also allow clicking the message bubble itself to open chat
        messageBubble.addEventListener('click', (e) => {
          // Don't trigger if clicking the close button
          if (e.target !== messageClose && !messageClose.contains(e.target)) {
            openChat();
          }
        });
      }

      // Listen for messages from iframe
      window.addEventListener('message', (event) => {
        if (event.data.type === 'CLOSE_CHAT') {
          closeChat();
        } else if (event.data.type === 'NEW_MESSAGE') {
          if (!isOpen) {
            badge.style.display = 'flex';
          }
        }
      });

      // Handle window resize with debouncing
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const nowMobile = isMobile();

          if (isOpen) {
            if (nowMobile && overlay.style.display === 'none') {
              // Switch from desktop to mobile view
              iframe.classList.remove('show');
              iframe.style.visibility = 'hidden';
              bubble.style.display = 'flex';

              // Ensure mobile iframe has src before showing
              if (!mobileIframe.src && iframe.src) {
                // Transfer the current session to mobile iframe
                const currentSrc = iframe.src;
                let mobileUrl = currentSrc.replace('embedded=true', 'embedded=true&mobile=true');
                // Ensure sessionId is preserved if not already in URL
                const sessionId = this.getOrCreateSessionId();
                if (!mobileUrl.includes('sessionId=')) {
                  const separator = mobileUrl.includes('?') ? '&' : '?';
                  mobileUrl = `${mobileUrl}${separator}sessionId=${encodeURIComponent(sessionId)}`;
                }
                mobileIframe.src = mobileUrl;
              }

              overlay.style.display = 'block';
              mobileIframe.style.visibility = 'visible';
              mobileIframe.classList.add('show');
            } else if (!nowMobile && overlay.style.display !== 'none') {
              // Switch from mobile to desktop view
              overlay.style.display = 'none';
              mobileIframe.classList.remove('show');
              mobileIframe.style.visibility = 'hidden';

              // Ensure desktop iframe has src before showing
              if (!iframe.src && mobileIframe.src) {
                // Transfer the current session to desktop iframe
                const currentSrc = mobileIframe.src;
                let desktopUrl = currentSrc.replace(/(&|\?)mobile=true/, '$1embedded=true');
                // Ensure sessionId is preserved if not already in URL
                const sessionId = this.getOrCreateSessionId();
                if (!desktopUrl.includes('sessionId=')) {
                  const separator = desktopUrl.includes('?') ? '&' : '?';
                  desktopUrl = `${desktopUrl}${separator}sessionId=${encodeURIComponent(sessionId)}`;
                }
                iframe.src = desktopUrl;
              }

              bubble.style.display = 'none';
              iframe.style.visibility = 'visible';
              iframe.classList.add('show');
            }
          }
        }, 150); // Debounce resize events
      });
    },

    forceHttps: function(url) {
      // Force HTTPS for all API requests
      if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
      }
      return url;
    },

    loadInitialMessages: function(messageBubble) {
      // Extract userId and chatbotGuid from apiUrl if available
      const urlMatch = this.config.apiUrl.match(/\/widget\/([^\/]+)\/([^\/\?]+)/);

      if (urlMatch && urlMatch[1] && urlMatch[2]) {
        const userId = urlMatch[1];
        const chatbotGuid = urlMatch[2];
        const cacheKey = `chatbot_${userId}_${chatbotGuid}`;

        // Check cache first (5 minute cache)
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            const cached = JSON.parse(cachedData);
            const fiveMinutes = 5 * 60 * 1000;

            if (Date.now() - cached.timestamp < fiveMinutes) {
              console.log('Using cached chatbot config');
              this.handleChatbotConfig(cached.config, messageBubble);
              return;
            } else {
              // Cache expired, remove it
              sessionStorage.removeItem(cacheKey);
            }
          } catch (e) {
            // Invalid cache data, remove it
            sessionStorage.removeItem(cacheKey);
          }
        }

        // Fetch chatbot configuration to get initial messages
        let baseUrl;
        try {
          baseUrl = this.config.apiUrl.split('/widget/')[0];
        } catch (error) {
          baseUrl = window.location.origin;
        }

        // Force HTTPS for API requests
        baseUrl = this.forceHttps(baseUrl);

        // Use fetch with timeout and retry logic
        this.fetchWithTimeout(`${baseUrl}/api/public/chatbot/${userId}/${chatbotGuid}`, 5000)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            // Cache the response
            sessionStorage.setItem(cacheKey, JSON.stringify({
              config: data,
              timestamp: Date.now()
            }));
            this.handleChatbotConfig(data, messageBubble);
          })
          .catch(error => {
            // Silent fallback in production - keep widget hidden on error
            console.log('Chat widget: Error fetching chatbot config, keeping widget hidden');
          });
      } else {
        // Invalid URL format - keep widget hidden
        console.log('Chat widget: Invalid URL format, keeping widget hidden');
      }
    },

    // Cache management for performance
    getCachedConfig: function(key) {
      try {
        const item = sessionStorage.getItem(`chatwidget_${key}`);
        if (!item) return null;

        const { data, timestamp } = JSON.parse(item);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - timestamp > fiveMinutes) {
          sessionStorage.removeItem(`chatwidget_${key}`);
          return null;
        }

        return data;
      } catch {
        return null;
      }
    },

    setCachedConfig: function(key, data) {
      try {
        sessionStorage.setItem(`chatwidget_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch {
        // Ignore storage errors
      }
    },

    handleChatbotConfig: function(data, messageBubble) {
      // Check if chatbot is active - if not, keep widget hidden
      if (!data.isActive) {
        console.log('Chat widget: Chatbot is inactive, keeping widget hidden');
        return;
      }

      // Chatbot is active, show the widget
      //console.log('Chat widget: Chatbot is active, showing widget');
      this.showWidget();

      // Store chatbot config for dismissal keys
      this.config.chatbotConfig = data;

      if (data.initialMessages && data.initialMessages.length > 0) {
        this.displayInitialMessages(messageBubble, data.initialMessages);
      } else {
        this.showDefaultMessage(messageBubble);
      }
    },

    // Fetch with timeout utility
    fetchWithTimeout: function(url, timeout = 5000) {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    },

    displayInitialMessages: function(messageBubble, messages) {
      if (messages.length === 0) {
        this.showDefaultMessage(messageBubble);
        return;
      }

      // Create a unique cache key based on chatbot and messages
      const messagesHash = messages.join('|');
      const chatbotId = this.config.chatbotConfig?.id || 'default';
      const dismissedKey = `chat-initial-messages-dismissed-${chatbotId}_${messagesHash}`;

      // Check if initial messages were manually dismissed
      try {
        const areDismissed = this.safeSessionStorage.getItem(dismissedKey) === 'true';
        if (areDismissed) {
          // Messages were dismissed, don't show anything (not even default)
          messageBubble.style.display = 'none';
          return;
        }
      } catch (error) {
        // Continue if sessionStorage is not available
      }

      // Hide the default message bubble since we'll create individual ones
      messageBubble.style.display = 'none';

      const container = document.getElementById('chatwidget-container');

      // Remove any previously rendered initial stack to avoid duplicates
      const existingStack = document.getElementById('chatwidget-initial-message-stack');
      if (existingStack) {
        existingStack.remove();
      }

      const stackWrapper = document.createElement('div');
      stackWrapper.id = 'chatwidget-initial-message-stack';
      stackWrapper.style.position = 'absolute';
      stackWrapper.style.bottom = '68px';
      stackWrapper.style.zIndex = '1002';
      stackWrapper.style.display = 'flex';
      stackWrapper.style.flexDirection = 'column';
      stackWrapper.style.alignItems = this.config.position === 'bottom-right' ? 'flex-end' : 'flex-start';
      stackWrapper.style.gap = '10px';
      stackWrapper.style.width = 'max-content';
      stackWrapper.style.maxWidth = '380px';
      if (this.config.position === 'bottom-right') {
        stackWrapper.style.right = '0';
        stackWrapper.style.left = 'auto';
      } else {
        stackWrapper.style.left = '0';
        stackWrapper.style.right = 'auto';
      }

      // Global close button (always visible when stack is shown)
      const closeWrapper = document.createElement('div');
      closeWrapper.style.display = 'flex';
      closeWrapper.style.width = '100%';
      closeWrapper.style.justifyContent = this.config.position === 'bottom-right' ? 'flex-end' : 'flex-start';
      closeWrapper.style.opacity = '0';
      closeWrapper.style.transform = 'translateY(6px)';
      closeWrapper.style.transition = 'all 0.25s ease';
      closeWrapper.style.pointerEvents = 'none';

      const globalCloseBtn = document.createElement('button');
      globalCloseBtn.id = 'chatwidget-global-close';
      globalCloseBtn.className = 'chatwidget-global-close-btn';
      globalCloseBtn.style.background = '#ffffff';
      globalCloseBtn.style.color = '#6b7280';
      globalCloseBtn.style.border = '1px solid #e5e7eb';
      globalCloseBtn.style.cursor = 'pointer';
      globalCloseBtn.style.borderRadius = '9999px';
      globalCloseBtn.style.padding = '8px';
      globalCloseBtn.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.12)';
      globalCloseBtn.style.transition = 'all 0.2s ease';
      globalCloseBtn.style.display = 'flex';
      globalCloseBtn.style.alignItems = 'center';
      globalCloseBtn.style.justifyContent = 'center';

      globalCloseBtn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;

      globalCloseBtn.addEventListener('mouseenter', () => {
        globalCloseBtn.style.background = '#f9fafb';
        globalCloseBtn.style.color = '#374151';
      });

      globalCloseBtn.addEventListener('mouseleave', () => {
        globalCloseBtn.style.background = '#ffffff';
        globalCloseBtn.style.color = '#6b7280';
      });

      globalCloseBtn.addEventListener('click', () => {
        const chatbotId = this.config.chatbotConfig?.id || 'default';
        const messagesHash = messages.join('|');
        const dismissedKey = `chat-initial-messages-dismissed-${chatbotId}_${messagesHash}`;
        this.safeSessionStorage.setItem(dismissedKey, 'true');
        this.hideAllInitialMessages();
      });

      closeWrapper.appendChild(globalCloseBtn);
      stackWrapper.appendChild(closeWrapper);

      const messagesContainer = document.createElement('div');
      messagesContainer.className = 'chatwidget-initial-message-stack';
      messagesContainer.style.display = 'flex';
      messagesContainer.style.flexDirection = 'column';
      messagesContainer.style.alignItems = this.config.position === 'bottom-right' ? 'flex-end' : 'flex-start';
      messagesContainer.style.gap = '14px';
      messagesContainer.style.width = 'max-content';
      stackWrapper.appendChild(messagesContainer);

      container.appendChild(stackWrapper);

      // Create individual bubbles for each message
      messages.forEach((message, index) => {
        const revealDelay = 3000 + (index * 1500);

        setTimeout(() => {
          if (!document.body.contains(stackWrapper)) {
            return;
          }

          const wrapper = document.createElement('div');
          wrapper.className = 'chatwidget-initial-message-item';
          wrapper.setAttribute('data-index', index);
          const isBottomRight = this.config.position === 'bottom-right';
          wrapper.style.display = 'block';
          wrapper.style.alignSelf = isBottomRight ? 'flex-end' : 'flex-start';
          wrapper.style.width = 'auto';
          wrapper.style.maxWidth = '380px';
          wrapper.style.minWidth = '280px';
          wrapper.style.opacity = '0';
          wrapper.style.transform = 'translateY(10px)';
          wrapper.style.transition = 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)';

          const individualBubble = document.createElement('div');
          individualBubble.className = 'chatwidget-initial-message-bubble';
          individualBubble.style.position = 'relative';
          individualBubble.style.background = '#ffffff';
          individualBubble.style.border = '1px solid #e2e8f0';
          individualBubble.style.borderRadius = '16px';
          individualBubble.style.padding = '10px 14px';
          individualBubble.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.12)';
          individualBubble.style.cursor = 'pointer';
          individualBubble.style.opacity = '1';
          individualBubble.style.visibility = 'visible';
          individualBubble.style.transform = 'none';

          const content = document.createElement('p');
          content.className = 'chatwidget-message-main';
          content.style.margin = '0';
          content.style.color = '#1f2937';
          content.style.lineHeight = '1.4';
          content.style.padding = '3px';
          content.textContent = message.content || message;

          individualBubble.appendChild(content);

          const arrow = document.createElement('div');
          arrow.className = 'chatwidget-initial-message-arrow';
          arrow.style.position = 'absolute';
          arrow.style.width = '16px';
          arrow.style.height = '16px';
          arrow.style.background = '#ffffff';
          arrow.style.borderRight = '1px solid #e2e8f0';
          arrow.style.borderBottom = '1px solid #e2e8f0';
          arrow.style.transform = 'rotate(45deg)';
          arrow.style.bottom = '-8px';
          if (this.config.position === 'bottom-right') {
            arrow.style.right = '16px';
          } else {
            arrow.style.left = '16px';
          }
          individualBubble.appendChild(arrow);

          // Make the bubble clickable to open chat and mark initial messages dismissed
          individualBubble.addEventListener('click', () => {
            try {
              // Use the same dismissal key as the global close button so the stack won't reappear
              const chatbotIdLocal = this.config.chatbotConfig?.id || 'default';
              const messagesHashLocal = messages.join('|');
              const dismissedKeyLocal = `chat-initial-messages-dismissed-${chatbotIdLocal}_${messagesHashLocal}`;
              this.safeSessionStorage.setItem(dismissedKeyLocal, 'true');
            } catch (e) {
              // ignore storage failures
            }

            // Open the chat UI
            const bubble = document.getElementById('chatwidget-bubble');
            if (bubble) bubble.click();

            // Hide the initial messages stack proactively
            try {
              this.hideAllInitialMessages();
            } catch (e) {
              // ignore
            }
          });

          wrapper.appendChild(individualBubble);

          const firstChild = messagesContainer.firstChild;
          if (firstChild) {
            messagesContainer.insertBefore(wrapper, firstChild);
          } else {
            messagesContainer.appendChild(wrapper);
          }

          const measuredWidth = Math.max(individualBubble.getBoundingClientRect().width, 280);
          wrapper.style.width = `${measuredWidth}px`;

          requestAnimationFrame(() => {
            wrapper.style.opacity = '1';
            wrapper.style.transform = 'translateY(0)';
            closeWrapper.style.opacity = '1';
            closeWrapper.style.transform = 'translateY(0)';
            closeWrapper.style.pointerEvents = 'auto';
          });
        }, revealDelay);
      });
    },

    showDefaultMessage: function(messageBubble) {
      // Check if default messages were dismissed
      const chatbotId = this.config.chatbotConfig?.id || 'default';
      const dismissedKey = `chat-default-message-dismissed-${chatbotId}`;
      
      try {
        const isDefaultDismissed = this.safeSessionStorage.getItem(dismissedKey) === 'true';
        if (isDefaultDismissed) {
          messageBubble.style.display = 'none';
          return;
        }
      } catch (error) {
        // Continue if sessionStorage is not available
      }

      // Show default message bubble after a short delay
      setTimeout(() => {
        messageBubble.style.opacity = '1';
        messageBubble.style.visibility = 'visible';
        messageBubble.style.transform = 'translateY(0) scale(1)';
        messageBubble.classList.add('visible');

        // Note: Removed auto-hide timeout - users must close message manually
      }, 3000);
    },

    // Global method to hide initial message (called from inline onclick)
    hideInitialMessage: function(index) {
      if (index !== undefined) {
        // Hide specific individual bubble
        const bubbleWrapper = document.querySelector(`.chatwidget-initial-message-item[data-index="${index}"]`);
        if (bubbleWrapper) {
          bubbleWrapper.style.opacity = '0';
          bubbleWrapper.style.transform = 'translateY(10px)';
          setTimeout(() => {
            bubbleWrapper.remove();
            const stack = document.getElementById('chatwidget-initial-message-stack');
            if (stack) {
              const messageItems = stack.querySelectorAll('.chatwidget-initial-message-item');
              if (messageItems.length === 0) {
                stack.remove();
              }
            }
          }, 300);
        }
      } else {
        // Hide default message bubble (legacy method)
        const messageBubble = document.getElementById('chatwidget-message-bubble');
        if (messageBubble) {
          messageBubble.classList.remove('visible');
        }
      }
    },

    // Method to show the widget when chatbot is active
    showWidget: function() {
      const container = document.getElementById('chatwidget-container');
      if (container) {
        container.style.display = 'block';
      }
    },

    // Method to hide the entire widget when chatbot is inactive
    hideWidget: function() {
      const container = document.getElementById('chatwidget-container');
      const overlay = document.getElementById('chatwidget-overlay');
      const mobileIframe = document.getElementById('chatwidget-mobile-iframe');

      if (container) container.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
      if (mobileIframe) mobileIframe.style.display = 'none';
    },

    // Helper method to hide all initial messages
    hideAllInitialMessages: function() {
      const stack = document.getElementById('chatwidget-initial-message-stack');
      if (!stack) return;

      const allBubbles = stack.querySelectorAll('.chatwidget-initial-message-item');
      allBubbles.forEach(bubble => {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(10px)';
      });

      const globalCloseBtn = stack.querySelector('#chatwidget-global-close');
      if (globalCloseBtn) {
        globalCloseBtn.style.opacity = '0';
        globalCloseBtn.style.transform = 'scale(0.9)';
      }

      setTimeout(() => {
        stack.remove();
      }, 300);
    },

    // Public API methods
    open: function() {
      if (this._initialized) {
        document.getElementById('chatwidget-bubble').click();
      }
    },

    close: function() {
      if (!this._initialized) return;

      const closeEvent = new Event('click');
      if (window.innerWidth < 1024) {
        document.getElementById('chatwidget-overlay').dispatchEvent(closeEvent);
      } else {
        // Send close message to iframe
        const iframe = document.getElementById('chatwidget-iframe');
        if (iframe) {
          iframe.contentWindow.postMessage({ type: 'CLOSE_CHAT' }, '*');
        }
      }
    },

    setConfig: function(options) {
      this.config = { ...this.config, ...options };
    },

    // Add reset method for reinitialization
    reset: function() {
      this._initialized = false;

      // Remove all widget elements  
      const elementsToRemove = [
        'chatwidget-bubble',
        'chatwidget-container', 
        'chatwidget-overlay',
        'chatwidget-mobile-iframe',
        'chatwidget-theme-vars',
        'chatwidget-styles',
        'chatwidget-iframe',
        'chatwidget-widget',
        'chatwidget-animations'
      ];

      elementsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.remove();
        }
      });

      // Clear internal state
      delete this.widget;
      delete this.bubble;
      delete this._currentSession;
    }
  };

  // Expose global API immediately
  window.ChatWidget = ChatWidget;

  // Performance-optimized initialization
  function autoInitialize() {
    if (window.ChatWidgetConfig && !ChatWidget._initialized) {
      // Use requestIdleCallback for non-blocking initialization
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => ChatWidget.init(window.ChatWidgetConfig), { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => ChatWidget.init(window.ChatWidgetConfig), 100);
      }
    }
  }

  // Defer initialization to avoid blocking main thread
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else if (document.readyState === 'interactive') {
    // DOM is interactive but may still be loading resources
    setTimeout(autoInitialize, 0);
  } else {
    // DOM is fully loaded
    autoInitialize();
  }

})();
