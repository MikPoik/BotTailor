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

      // Validate required config
      if (!this.config.apiUrl) {
        // Silent fail in production - widget won't initialize
        return;
      }

      // Validate that the API URL includes the proper /widget/ path for external embeds
      // This prevents the widget from showing when accessed through incorrect URLs
      if (!this.config.apiUrl.includes('/widget/')) {
        console.warn('Chat widget: API URL must include /widget/ path for proper functionality');
        // Silent fail - don't show widget for incorrectly formatted URLs
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
          <div class="chatwidget-speech-bubble" style="background: #f8f9fa; border-radius: 12px; padding: 10px 12px; margin-bottom: 6px; position: relative; min-width: 200px; max-width: 280px; word-wrap: break-word;">
            <p class="chatwidget-message-main" style="margin: 0; color: #333; line-height: 1.4;">Hello there! Need any help?</p>
          </div>
          <button id="chatwidget-message-close" class="chatwidget-close-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #666;">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
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
      bubble.style.transition = 'all 0.3s ease';

      bubble.innerHTML = `
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
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
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
      
      // Add initial styles to prevent white screen during transitions
      iframe.style.width = '450px';
      iframe.style.height = '75vh';
      iframe.style.maxHeight = '800px';
      iframe.style.minHeight = '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.position = 'fixed';
      iframe.style.bottom = '24px';
      iframe.style.backgroundColor = 'transparent';
      iframe.style.visibility = 'hidden';
      iframe.style.transition = 'all 0.3s ease-out';
      iframe.style.zIndex = this.config.zIndex;
      if (this.config.position === 'bottom-right') {
        iframe.style.right = '24px';
      } else {
        iframe.style.left = '24px';
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
      mobileIframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
      
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
              // Build URL with sessionId if provided, otherwise let server generate it
              const sessionParam = this.config.sessionId ? `sessionId=${this.config.sessionId}&` : '';
              const themeParams = `primaryColor=${encodeURIComponent(this.config.primaryColor || '#2563eb')}&backgroundColor=${encodeURIComponent(this.config.backgroundColor || '#ffffff')}&textColor=${encodeURIComponent(this.config.textColor || '#1f2937')}&`;

              // Check if apiUrl already contains a specific widget path
              let widgetUrl;
              if (this.config.apiUrl.includes('/widget/')) {
                // Specific widget URL - use as-is with query parameters
                const separator = this.config.apiUrl.includes('?') ? '&' : '?';
                widgetUrl = `${this.config.apiUrl}${separator}${sessionParam}${themeParams}mobile=true&embedded=true`;
              } else {
                // Base URL - append /chat-widget path
                widgetUrl = `${this.config.apiUrl}/chat-widget?${sessionParam}${themeParams}mobile=true&embedded=true`;
              }

              // Force HTTPS for iframe URL
              mobileIframe.src = this.forceHttps(widgetUrl);
            } catch (error) {
              // Fallback URL construction
              mobileIframe.src = this.forceHttps(`${this.config.apiUrl}?${themeParams}mobile=true&embedded=true`);
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
              // Build URL with sessionId if provided, otherwise let server generate it
              const sessionParam = this.config.sessionId ? `sessionId=${this.config.sessionId}&` : '';
              const themeParams = `primaryColor=${encodeURIComponent(this.config.primaryColor || '#2563eb')}&backgroundColor=${encodeURIComponent(this.config.backgroundColor || '#ffffff')}&textColor=${encodeURIComponent(this.config.textColor || '#1f2937')}&`;

              // Check if apiUrl already contains a specific widget path
              let widgetUrl;
              if (this.config.apiUrl.includes('/widget/')) {
                // Specific widget URL - use as-is with query parameters
                const separator = this.config.apiUrl.includes('?') ? '&' : '?';
                widgetUrl = `${this.config.apiUrl}${separator}${sessionParam}${themeParams}mobile=false&embedded=true`;
              } else {
                // Base URL - append /chat-widget path
                widgetUrl = `${this.config.apiUrl}/chat-widget?${sessionParam}${themeParams}mobile=false&embedded=true`;
              }

              // Force HTTPS for iframe URL
              iframe.src = this.forceHttps(widgetUrl);
            } catch (error) {
              // Fallback URL construction
              iframe.src = this.forceHttps(`${this.config.apiUrl}?${themeParams}mobile=false&embedded=true`);
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
                const mobileUrl = currentSrc.replace('mobile=false', 'mobile=true');
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
                const desktopUrl = currentSrc.replace('mobile=true', 'mobile=false');
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

        // Fetch chatbot configuration to get initial messages
        let baseUrl;
        try {
          baseUrl = this.config.apiUrl.split('/widget/')[0];
        } catch (error) {
          baseUrl = window.location.origin;
        }
        
        // Force HTTPS for API requests
        baseUrl = this.forceHttps(baseUrl);
        
        fetch(`${baseUrl}/api/public/chatbot/${userId}/${chatbotGuid}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.initialMessages && data.initialMessages.length > 0) {
              this.displayInitialMessages(messageBubble, data.initialMessages);
            } else {
              this.showDefaultMessage(messageBubble);
            }
          })
          .catch(error => {
            // Silent fallback in production
            this.showDefaultMessage(messageBubble);
          });
      } else {
        this.showDefaultMessage(messageBubble);
      }
    },

    displayInitialMessages: function(messageBubble, messages) {
      if (messages.length === 0) {
        this.showDefaultMessage(messageBubble);
        return;
      }

      // Hide the default message bubble since we'll create individual ones
      messageBubble.style.display = 'none';

      const container = document.getElementById('chatwidget-container');
      
      // Create individual bubbles for each message
      messages.forEach((message, index) => {
        const individualBubble = document.createElement('div');
        individualBubble.className = 'chatwidget-initial-message-bubble';
        individualBubble.setAttribute('data-index', index);
        
        // Add initial styles to prevent FOUC
        individualBubble.style.position = 'absolute';
        individualBubble.style.maxWidth = '350px';
        individualBubble.style.background = 'transparent';
        individualBubble.style.borderRadius = '16px';
        individualBubble.style.padding = '8px';
        individualBubble.style.transform = 'translateY(10px) scale(0.95)';
        individualBubble.style.opacity = '0';
        individualBubble.style.visibility = 'hidden';
        individualBubble.style.transition = 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
        individualBubble.style.cursor = 'pointer';
        if (this.config.position === 'bottom-right') {
          individualBubble.style.right = '0';
        } else {
          individualBubble.style.left = '0';
        }
        
        individualBubble.innerHTML = `
          <div class="chatwidget-message-content" style="display: flex; align-items: flex-start; gap: 12px;">
            <div class="chatwidget-speech-bubble" style="background: #f8f9fa; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; position: relative; min-width: 200px; max-width: 280px; word-wrap: break-word;">
              <p class="chatwidget-message-main" style="margin: 0; color: #333; line-height: 1.4;">${message.content || message}</p>
            </div>
            <button class="chatwidget-close-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #666; hover:background: #f0f0f0;" data-index="${index}">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        `;
        
        // Position the bubble above previous ones
        individualBubble.style.bottom = `${80 + (index * 80)}px`;
        
        // Add event listeners for the individual bubble
        const closeBtn = individualBubble.querySelector('.chatwidget-close-btn');
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hideInitialMessage(index);
        });
        
        // Make the bubble clickable to open chat (but not the close button)
        individualBubble.addEventListener('click', (e) => {
          if (!closeBtn.contains(e.target)) {
            const bubble = document.getElementById('chatwidget-bubble');
            if (bubble) bubble.click();
          }
        });
        
        container.appendChild(individualBubble);
        
        // Show bubble with delay based on index
        setTimeout(() => {
          individualBubble.style.opacity = '1';
          individualBubble.style.visibility = 'visible';
          individualBubble.style.transform = 'translateY(0) scale(1)';
          individualBubble.classList.add('visible');
        }, 3000 + (index * 1000));
        
        // Auto-hide after showing all messages (only for the last message)
        if (index === messages.length - 1) {
          setTimeout(() => {
            this.hideAllInitialMessages();
          }, 3000 + (messages.length * 1000) + 8000);
        }
      });
    },

    showDefaultMessage: function(messageBubble) {
      // Show default message bubble after a short delay
      setTimeout(() => {
        messageBubble.style.opacity = '1';
        messageBubble.style.visibility = 'visible';
        messageBubble.style.transform = 'translateY(0) scale(1)';
        messageBubble.classList.add('visible');

        // Auto-hide after 10 seconds unless user interacts
        setTimeout(() => {
          if (messageBubble.classList.contains('visible')) {
            messageBubble.style.opacity = '0';
            messageBubble.style.visibility = 'hidden';
            messageBubble.style.transform = 'translateY(10px) scale(0.95)';
            messageBubble.classList.remove('visible');
          }
        }, 10000);
      }, 3000);
    },

    // Global method to hide initial message (called from inline onclick)
    hideInitialMessage: function(index) {
      if (index !== undefined) {
        // Hide specific individual bubble
        const bubble = document.querySelector(`.chatwidget-initial-message-bubble[data-index="${index}"]`);
        if (bubble) {
          bubble.classList.remove('visible');
          setTimeout(() => bubble.remove(), 300);
        }
      } else {
        // Hide default message bubble (legacy method)
        const messageBubble = document.getElementById('chatwidget-message-bubble');
        if (messageBubble) {
          messageBubble.classList.remove('visible');
        }
      }
    },

    // Helper method to hide all initial messages
    hideAllInitialMessages: function() {
      const allBubbles = document.querySelectorAll('.chatwidget-initial-message-bubble');
      allBubbles.forEach(bubble => {
        bubble.classList.remove('visible');
        setTimeout(() => bubble.remove(), 300);
      });
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

  // Auto-initialize function
  function autoInitialize() {
    if (window.ChatWidgetConfig && !ChatWidget._initialized) {
      ChatWidget.init(window.ChatWidgetConfig);
    }
  }

  // Try to initialize immediately
  autoInitialize();

  // Try again when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    // DOM is already ready, try in next tick
    setTimeout(autoInitialize, 0);
  }

  // Final fallback after a short delay
  setTimeout(autoInitialize, 100);

})();