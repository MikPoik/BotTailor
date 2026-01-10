# Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## User Preferences

Preferred communication style: Like talking to a software developer, technical and detailed.

## System Architecture

### Frontend Architecture
- **Node version**: NodeJs 20
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **UI/UX Decisions**: Mobile-first responsive design; customizable floating chat bubble, full-featured chat UI with message bubbles, typing indicators, and rich content support. Theming is controlled via a color resolution system that prioritizes embed parameters, then UI Designer theme settings, and finally default CSS values. Background images can be uploaded and displayed on the home screen with text readability overlay.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database ORM**: Drizzle ORM for PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Stack Auth (@stackframe/react) with custom middleware wrapper
- **AI Integration**: OpenAI API for chat responses, embeddings, and structured generation
- **Payment Processing**: Stripe for subscription management
- **File Storage**: AWS S3 for uploads (images, files)
- **Email Service**: Email notifications for form submissions
- **Vector Search**: pgvector for semantic search over website content (1536 dimensions)

### System Design Choices
- **Chat Widget System**: Features a customizable floating chat bubble (bottom-right/bottom-left) and a full-featured chat interface supporting text messages, interactive cards, menu options, and quick replies.
- **Message System**: Supports rich messages with images, titles, descriptions, action buttons, interactive menus, quick replies, forms, ratings, and multiselect menus. Includes streaming support for AI responses. Uses polling for real-time updates.
- **Data Flow**: Sessions are initialized by the client, followed by a welcome message from the server. Message exchange occurs in real-time via polling. The server can send structured messages with interactive elements, and client selections trigger server responses.
- **Database Schema**: Includes Users (Stack Auth sync + app data), Chat Sessions (session management), Messages (rich content via JSON metadata), Chatbot Configs (AI settings, email config, home screen design), Website Sources (content scraping), Website Content (vectorized for RAG), Surveys (builder + sessions), and Subscriptions (Stripe integration).
- **Theming System**: Implements a complete color priority system where embed parameters override UI Designer theme settings, which in turn override default CSS. Includes support for primary, background, and text colors, and background images. Email configuration for form submissions is integrated, allowing form functionality to be conditional on proper email setup.
- **Real-time Communication**: Uses HTTP polling for message synchronization, chosen for simpler deployment and broader compatibility over WebSockets.
- **AI Architecture**: Modular OpenAI service in `/server/openai/` with specialized handlers for chat responses, surveys, prompt assistance, and streaming. Uses best-effort JSON parsing for robust handling of AI output. Context builder includes website content (RAG), conversation history, and active survey state.
- **RAG System**: Website scraping with Cheerio and Playwright, content chunking, OpenAI embeddings (ada-002, 1536 dims), stored in PostgreSQL with pgvector. Semantic search provides context to AI responses.
- **Survey System**: Visual survey builder, conditional flow support, AI-powered survey assistance, response analytics with charts, and session tracking.
- **Authentication Flow**: Stack Auth handles user authentication via SDK, custom middleware extracts `x-stack-user-id` header, users synced to app database on first login. Dual tables: `neon_auth.users_sync` (Stack managed) and `users` (app data).
- **Payment Flow**: Stripe checkout for subscriptions, webhook handlers for lifecycle events, usage tracking (messages per month), plan enforcement with limits on bots and messages.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **@stackframe/react**: Stack Auth SDK for authentication
- **openai**: OpenAI API client for AI features
- **stripe**: Payment processing and subscriptions
- **@aws-sdk/client-s3**: File storage in S3
- **pgvector**: PostgreSQL vector extension for embeddings
- **cheerio**: HTML parsing for website scraping
- **playwright**: Browser automation for dynamic content
- **wouter**: Lightweight client-side routing
- **zod**: Schema validation and type safety
- **recharts**: Data visualization for analytics

### Development Tools (for context, not integrated into production build)
- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool with HMR
- **esbuild**: Backend bundling for production
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Key Implementation Details

### Database Schema Organization
The database follows a clear separation of concerns:

**Authentication Tables:**
- `neon_auth.users_sync` - Managed by Stack Auth, read-only for application
- `users` - Application-specific user data (references Stack Auth users by ID)

**Chatbot System:**
- `chatbot_configs` - AI settings, prompts, email config, UI design, identified by `guid` for public access
- `chat_sessions` - Conversation sessions with optional user association and active survey tracking
- `messages` - Chat messages with `messageType` and rich `metadata` JSON field

**Content & RAG:**
- `website_sources` - Scraped websites, uploaded files, or text content
- `website_content` - Chunked content with 1536-dim vector embeddings for semantic search

**Survey System:**
- `surveys` - Survey definitions with JSON `surveyConfig` containing questions and flow
- `survey_sessions` - User progress through surveys with response tracking

**Subscription & Billing:**
- `subscription_plans` - Plan definitions with Stripe IDs and feature limits
- `subscriptions` - User subscriptions with usage tracking and Stripe sync

### API Route Structure
Routes are organized in `/server/routes/` by domain:
- **auth.ts**: User sync endpoint (`/api/ensure-user`)
- **chat.ts**: Message exchange, session management, AI responses
- **chatbots.ts**: CRUD for chatbot configs, model settings
- **surveys.ts**: Survey builder, session management, analytics
- **public.ts**: Public chatbot access (no auth required)
- **uploads.ts**: File uploads to S3
- **websites.ts**: Website scraping and content management
- **ui-designer.ts**: Dynamic home screen configuration
- **contact.ts**: Contact form submissions with email
- **subscription.ts**: Stripe checkout, webhooks, plan management

### Authentication Pattern
1. Stack Auth handles all authentication UI and session management
2. On successful auth, Stack Auth includes `x-stack-user-id` header in all requests
3. `neonAuthMiddleware` extracts this header and attaches user to `req.neonUser`
4. Protected routes use `isAuthenticated` middleware to enforce auth
5. First login triggers `/api/ensure-user` to sync user to app database
6. Public routes (embed widget, public chatbot access) bypass auth entirely

### OpenAI Service Architecture
Located in `/server/openai/`, follows modular design:
- **client.ts**: OpenAI client singleton with configuration
- **response-generator.ts**: Main AI response functions (chat, surveys, prompts)
- **streaming-handler.ts**: Server-sent events for streaming responses
- **context-builder.ts**: Builds system prompts with RAG context, conversation history, survey state
- **response-parser.ts**: Best-effort JSON parsing, bubble completion detection
- **error-handler.ts**: Graceful fallbacks for AI failures
- **schema.ts**: Zod schemas for structured AI output
- **dynamic-content-validator.ts**: Validates survey topic references
- **survey-menu-validator.ts**: Ensures survey questions have required options

Key patterns:
- Uses `gpt-4o` model by default (configurable per chatbot)
- Temperature stored as 0-10 scale, divided by 10 for API
- Best-effort JSON parser handles incomplete/malformed AI responses
- Streaming responses use chunking with `isStreaming: true` metadata
- RAG context includes up to 5 most relevant website content chunks

### Message Metadata Structure
The `metadata` JSON field on messages supports multiple types:

**Text Messages:**
```json
{ "isStreaming": true, "chunks": [...] }
```

**Card Messages:**
```json
{
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "buttons": [{"id": "btn1", "text": "Click", "action": "message", "payload": "..."}]
}
```

**Menu/Multiselect Messages:**
```json
{
  "options": [{"id": "opt1", "text": "Option 1", "action": "message"}],
  "allowMultiple": true,
  "minSelections": 1,
  "maxSelections": 3
}
```

**Rating Messages:**
```json
{
  "minValue": 1,
  "maxValue": 5,
  "ratingType": "stars|numbers|scale"
}
```

**Form Messages:**
```json
{
  "formFields": [{"id": "email", "label": "Email", "type": "email", "required": true}],
  "submitButton": {"id": "submit", "text": "Send", "action": "form_submit"}
}
```

### UI Designer Home Screen Config
Stored in `chatbot_configs.homeScreenConfig` as JSON:
```json
{
  "version": "1.0",
  "components": [
    {
      "id": "header_1",
      "type": "header|category_tabs|topic_grid|quick_actions|footer",
      "props": {
        "title": "...",
        "topics": [{"id": "t1", "title": "...", "actionType": "message|survey", "surveyId": 123}]
      },
      "order": 1,
      "visible": true
    }
  ],
  "theme": {"primaryColor": "#...", "backgroundImageUrl": "..."},
  "settings": {"enableSearch": false, "enableCategories": true}
}
```

Components rendered by `dynamic-home-screen.tsx` using `component-registry.tsx` mapping.

### Subscription Enforcement
Plan limits checked on:
- Creating new chatbots (check `maxBots`)
- Sending messages (check `maxMessagesPerMonth`)
- Monthly usage resets tracked via `messagesUsedThisMonth`

Stripe webhooks handle:
- `checkout.session.completed` - Create subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_failed` - Mark subscription as past_due

### Embed Widget Pattern
Widget can be embedded via:
1. Direct URL with `?embedded=true` parameter
2. Script injection with `window.__CHAT_WIDGET_CONFIG__`

Embed bypasses:
- Authentication completely
- Layout/navigation (Navbar/Footer)
- Redirects to login

Uses `chatbotGuid` from URL params or config to load chatbot settings.

### File Upload Flow
1. Client uploads file via `/api/uploads` (multipart/form-data)
2. Server validates file type and size
3. File uploaded to S3 with unique key
4. Returns S3 URL for storage in database
5. Used for: avatars, background images, uploaded documents for RAG


# Source Code Tree

Generated on: 2026-01-08T19:41:07.825Z


{
  "title": "Directory Tree",
  "generatedAt": "2026-01-10T22:22:33.967Z",
  "simpleMode": true,
  "directoryTree": {
    "client": {
      "type": "directory",
      "children": {
        "src": {
          "type": "directory",
          "children": {
            "App.tsx": {
              "type": "file",
              "path": "client/src/App.tsx"
            },
            "components": {
              "type": "directory",
              "children": {
                "chat": {
                  "type": "directory",
                  "children": {
                    "about-view.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/about-view.tsx"
                    },
                    "chat-interface.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/chat-interface.tsx"
                    },
                    "chat-tab.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/chat-tab.tsx"
                    },
                    "chat-widget.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/chat-widget.tsx"
                    },
                    "color-utils.ts": {
                      "type": "file",
                      "path": "client/src/components/chat/color-utils.ts"
                    },
                    "contact-form-submission.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/contact-form-submission.tsx"
                    },
                    "home-tab.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/home-tab.tsx"
                    },
                    "message-bubble.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/message-bubble.tsx"
                    },
                    "message-types": {
                      "type": "directory",
                      "children": {
                        "card-message.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/message-types/card-message.tsx"
                        },
                        "form-message.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/message-types/form-message.tsx"
                        },
                        "menu-message.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/message-types/menu-message.tsx"
                        },
                        "multiselect-message.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/message-types/multiselect-message.tsx"
                        },
                        "rating-message.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/message-types/rating-message.tsx"
                        }
                      }
                    },
                    "prompt-assistant-chatbox.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/prompt-assistant-chatbox.tsx"
                    },
                    "rich-message.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/rich-message.tsx"
                    },
                    "streaming-message.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/streaming-message.tsx"
                    },
                    "survey-assistant-chatbox.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/survey-assistant-chatbox.tsx"
                    },
                    "tab-navigation.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/tab-navigation.tsx"
                    },
                    "tabbed-chat-interface.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/tabbed-chat-interface.tsx"
                    },
                    "typing-indicator.tsx": {
                      "type": "file",
                      "path": "client/src/components/chat/typing-indicator.tsx"
                    },
                    "widget": {
                      "type": "directory",
                      "children": {
                        "FloatingBubble.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/widget/FloatingBubble.tsx"
                        },
                        "InitialMessageBubbles.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/widget/InitialMessageBubbles.tsx"
                        },
                        "WidgetHeader.tsx": {
                          "type": "file",
                          "path": "client/src/components/chat/widget/WidgetHeader.tsx"
                        },
                        "useWidgetTheme.ts": {
                          "type": "file",
                          "path": "client/src/components/chat/widget/useWidgetTheme.ts"
                        }
                      }
                    }
                  }
                },
                "client-only.tsx": {
                  "type": "file",
                  "path": "client/src/components/client-only.tsx"
                },
                "cookie-consent-modal.tsx": {
                  "type": "file",
                  "path": "client/src/components/cookie-consent-modal.tsx"
                },
                "embed": {
                  "type": "directory",
                  "children": {
                    "CTAAssistant.tsx": {
                      "type": "file",
                      "path": "client/src/components/embed/CTAAssistant.tsx"
                    },
                    "EmbedChatInterface.tsx": {
                      "type": "file",
                      "path": "client/src/components/embed/EmbedChatInterface.tsx"
                    },
                    "EmbedDesignForm-v2.tsx": {
                      "type": "file",
                      "path": "client/src/components/embed/EmbedDesignForm-v2.tsx"
                    },
                    "EmbedDesignForm.tsx": {
                      "type": "file",
                      "path": "client/src/components/embed/EmbedDesignForm.tsx"
                    },
                    "EmbedDesignPreview.tsx": {
                      "type": "file",
                      "path": "client/src/components/embed/EmbedDesignPreview.tsx"
                    },
                    "EmbedThemeCustomizer.tsx": {
                      "type": "file",
                      "path": "client/src/components/embed/EmbedThemeCustomizer.tsx"
                    },
                    "embed-components": {
                      "type": "directory",
                      "children": {
                        "EmbedFooter.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-components/EmbedFooter.tsx"
                        },
                        "EmbedHeader.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-components/EmbedHeader.tsx"
                        },
                        "EmbedInput.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-components/EmbedInput.tsx"
                        },
                        "EmbedMessages.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-components/EmbedMessages.tsx"
                        },
                        "EmbedWelcome.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-components/EmbedWelcome.tsx"
                        }
                      }
                    },
                    "embed-cta": {
                      "type": "directory",
                      "children": {
                        "CTABuilder.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-cta/CTABuilder.tsx"
                        },
                        "CTAPreview.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-cta/CTAPreview.tsx"
                        },
                        "CTAView.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-cta/CTAView.tsx"
                        },
                        "cta-component-registry.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-cta/cta-component-registry.tsx"
                        },
                        "cta-components": {
                          "type": "directory",
                          "children": {
                            "Badge.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/Badge.tsx"
                            },
                            "CTAButtonGroup.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/CTAButtonGroup.tsx"
                            },
                            "CTADescription.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/CTADescription.tsx"
                            },
                            "CTAFeatureList.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/CTAFeatureList.tsx"
                            },
                            "CTAForm.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/CTAForm.tsx"
                            },
                            "CTAHeader.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/CTAHeader.tsx"
                            },
                            "Container.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/Container.tsx"
                            },
                            "Divider.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/Divider.tsx"
                            },
                            "RichText.tsx": {
                              "type": "file",
                              "path": "client/src/components/embed/embed-cta/cta-components/RichText.tsx"
                            }
                          }
                        },
                        "style-utils.ts": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-cta/style-utils.ts"
                        }
                      }
                    },
                    "embed-designs": {
                      "type": "directory",
                      "children": {
                        "CompactEmbed.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-designs/CompactEmbed.tsx"
                        },
                        "FullEmbed.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-designs/FullEmbed.tsx"
                        },
                        "MinimalEmbed.tsx": {
                          "type": "file",
                          "path": "client/src/components/embed/embed-designs/MinimalEmbed.tsx"
                        }
                      }
                    }
                  }
                },
                "footer.tsx": {
                  "type": "file",
                  "path": "client/src/components/footer.tsx"
                },
                "navbar.tsx": {
                  "type": "file",
                  "path": "client/src/components/navbar.tsx"
                },
                "theme-toggle.tsx": {
                  "type": "file",
                  "path": "client/src/components/theme-toggle.tsx"
                },
                "ui-designer": {
                  "type": "directory",
                  "children": {
                    "component-registry.tsx": {
                      "type": "file",
                      "path": "client/src/components/ui-designer/component-registry.tsx"
                    },
                    "dynamic-home-screen.tsx": {
                      "type": "file",
                      "path": "client/src/components/ui-designer/dynamic-home-screen.tsx"
                    }
                  }
                }
              }
            },
            "contexts": {
              "type": "directory",
              "children": {
                "theme-context.tsx": {
                  "type": "file",
                  "path": "client/src/contexts/theme-context.tsx"
                }
              }
            },
            "entry-server.tsx": {
              "type": "file",
              "path": "client/src/entry-server.tsx"
            },
            "hooks": {
              "type": "directory",
              "children": {
                "use-chat.ts": {
                  "type": "file",
                  "path": "client/src/hooks/use-chat.ts"
                },
                "use-global-chat-session.ts": {
                  "type": "file",
                  "path": "client/src/hooks/use-global-chat-session.ts"
                },
                "use-mobile.tsx": {
                  "type": "file",
                  "path": "client/src/hooks/use-mobile.tsx"
                },
                "use-toast.ts": {
                  "type": "file",
                  "path": "client/src/hooks/use-toast.ts"
                },
                "useAuth.ts": {
                  "type": "file",
                  "path": "client/src/hooks/useAuth.ts"
                },
                "useContactForm.ts": {
                  "type": "file",
                  "path": "client/src/hooks/useContactForm.ts"
                },
                "useEmbedConfig.ts": {
                  "type": "file",
                  "path": "client/src/hooks/useEmbedConfig.ts"
                },
                "useStreamingMessage.ts": {
                  "type": "file",
                  "path": "client/src/hooks/useStreamingMessage.ts"
                }
              }
            },
            "lib": {
              "type": "directory",
              "children": {
                "authUtils.ts": {
                  "type": "file",
                  "path": "client/src/lib/authUtils.ts"
                },
                "client-metadata.ts": {
                  "type": "file",
                  "path": "client/src/lib/client-metadata.ts"
                },
                "markdown-utils.ts": {
                  "type": "file",
                  "path": "client/src/lib/markdown-utils.ts"
                },
                "queryClient.ts": {
                  "type": "file",
                  "path": "client/src/lib/queryClient.ts"
                },
                "stack.ts": {
                  "type": "file",
                  "path": "client/src/lib/stack.ts"
                },
                "utils.ts": {
                  "type": "file",
                  "path": "client/src/lib/utils.ts"
                }
              }
            },
            "main.tsx": {
              "type": "file",
              "path": "client/src/main.tsx"
            },
            "pages": {
              "type": "directory",
              "children": {
                "Subscription.tsx": {
                  "type": "file",
                  "path": "client/src/pages/Subscription.tsx"
                },
                "add-data.tsx": {
                  "type": "file",
                  "path": "client/src/pages/add-data.tsx"
                },
                "chat-history.tsx": {
                  "type": "file",
                  "path": "client/src/pages/chat-history.tsx"
                },
                "chat-widget.tsx": {
                  "type": "file",
                  "path": "client/src/pages/chat-widget.tsx"
                },
                "chatbot-edit.tsx": {
                  "type": "file",
                  "path": "client/src/pages/chatbot-edit.tsx"
                },
                "chatbot-embed.tsx": {
                  "type": "file",
                  "path": "client/src/pages/chatbot-embed.tsx"
                },
                "chatbot-form.tsx": {
                  "type": "file",
                  "path": "client/src/pages/chatbot-form.tsx"
                },
                "chatbot-test.tsx": {
                  "type": "file",
                  "path": "client/src/pages/chatbot-test.tsx"
                },
                "contact.tsx": {
                  "type": "file",
                  "path": "client/src/pages/contact.tsx"
                },
                "dashboard.tsx": {
                  "type": "file",
                  "path": "client/src/pages/dashboard.tsx"
                },
                "docs.tsx": {
                  "type": "file",
                  "path": "client/src/pages/docs.tsx"
                },
                "embed-design-edit.tsx": {
                  "type": "file",
                  "path": "client/src/pages/embed-design-edit.tsx"
                },
                "embed-designs.tsx": {
                  "type": "file",
                  "path": "client/src/pages/embed-designs.tsx"
                },
                "embed.tsx": {
                  "type": "file",
                  "path": "client/src/pages/embed.tsx"
                },
                "home.tsx": {
                  "type": "file",
                  "path": "client/src/pages/home.tsx"
                },
                "not-found.tsx": {
                  "type": "file",
                  "path": "client/src/pages/not-found.tsx"
                },
                "pricing.tsx": {
                  "type": "file",
                  "path": "client/src/pages/pricing.tsx"
                },
                "privacy.tsx": {
                  "type": "file",
                  "path": "client/src/pages/privacy.tsx"
                },
                "survey-analytics.tsx": {
                  "type": "file",
                  "path": "client/src/pages/survey-analytics.tsx"
                },
                "survey-builder.tsx": {
                  "type": "file",
                  "path": "client/src/pages/survey-builder.tsx"
                },
                "terms.tsx": {
                  "type": "file",
                  "path": "client/src/pages/terms.tsx"
                },
                "ui-designer.tsx": {
                  "type": "file",
                  "path": "client/src/pages/ui-designer.tsx"
                }
              }
            },
            "routes": {
              "type": "directory",
              "children": {
                "registry.ts": {
                  "type": "file",
                  "path": "client/src/routes/registry.ts"
                }
              }
            },
            "types": {
              "type": "directory",
              "children": {
                "message-metadata.ts": {
                  "type": "file",
                  "path": "client/src/types/message-metadata.ts"
                }
              }
            }
          }
        }
      }
    },
    "server": {
      "type": "directory",
      "children": {
        "ai-response-schema.ts": {
          "type": "file",
          "path": "server/ai-response-schema.ts"
        },
        "db.ts": {
          "type": "file",
          "path": "server/db.ts"
        },
        "email-service.ts": {
          "type": "file",
          "path": "server/email-service.ts"
        },
        "embed-service.ts": {
          "type": "file",
          "path": "server/embed-service.ts"
        },
        "index.ts": {
          "type": "file",
          "path": "server/index.ts"
        },
        "neonAuth.ts": {
          "type": "file",
          "path": "server/neonAuth.ts"
        },
        "openai": {
          "type": "directory",
          "children": {
            "client.ts": {
              "type": "file",
              "path": "server/openai/client.ts"
            },
            "context-builder.ts": {
              "type": "file",
              "path": "server/openai/context-builder.ts"
            },
            "cta-generator.ts": {
              "type": "file",
              "path": "server/openai/cta-generator.ts"
            },
            "dynamic-content-validator.ts": {
              "type": "file",
              "path": "server/openai/dynamic-content-validator.ts"
            },
            "error-handler.ts": {
              "type": "file",
              "path": "server/openai/error-handler.ts"
            },
            "index.ts": {
              "type": "file",
              "path": "server/openai/index.ts"
            },
            "response-generator.ts": {
              "type": "file",
              "path": "server/openai/response-generator.ts"
            },
            "response-parser.ts": {
              "type": "file",
              "path": "server/openai/response-parser.ts"
            },
            "schema.ts": {
              "type": "file",
              "path": "server/openai/schema.ts"
            },
            "streaming-handler.ts": {
              "type": "file",
              "path": "server/openai/streaming-handler.ts"
            },
            "survey-menu-validator.ts": {
              "type": "file",
              "path": "server/openai/survey-menu-validator.ts"
            }
          }
        },
        "routes": {
          "type": "directory",
          "children": {
            "auth.ts": {
              "type": "file",
              "path": "server/routes/auth.ts"
            },
            "chat.ts": {
              "type": "file",
              "path": "server/routes/chat.ts"
            },
            "chatbots.ts": {
              "type": "file",
              "path": "server/routes/chatbots.ts"
            },
            "contact.ts": {
              "type": "file",
              "path": "server/routes/contact.ts"
            },
            "cta-ai.ts": {
              "type": "file",
              "path": "server/routes/cta-ai.ts"
            },
            "embeds.ts": {
              "type": "file",
              "path": "server/routes/embeds.ts"
            },
            "index.ts": {
              "type": "file",
              "path": "server/routes/index.ts"
            },
            "public.ts": {
              "type": "file",
              "path": "server/routes/public.ts"
            },
            "subscription.ts": {
              "type": "file",
              "path": "server/routes/subscription.ts"
            },
            "surveys.ts": {
              "type": "file",
              "path": "server/routes/surveys.ts"
            },
            "ui-designer.ts": {
              "type": "file",
              "path": "server/routes/ui-designer.ts"
            },
            "uploads.ts": {
              "type": "file",
              "path": "server/routes/uploads.ts"
            },
            "websites.ts": {
              "type": "file",
              "path": "server/routes/websites.ts"
            }
          }
        },
        "routes.ts": {
          "type": "file",
          "path": "server/routes.ts"
        },
        "seed-plans.ts": {
          "type": "file",
          "path": "server/seed-plans.ts"
        },
        "storage.ts": {
          "type": "file",
          "path": "server/storage.ts"
        },
        "ui-designer-service.ts": {
          "type": "file",
          "path": "server/ui-designer-service.ts"
        },
        "upload-service.ts": {
          "type": "file",
          "path": "server/upload-service.ts"
        },
        "vite.ts": {
          "type": "file",
          "path": "server/vite.ts"
        },
        "website-scanner.ts": {
          "type": "file",
          "path": "server/website-scanner.ts"
        }
      }
    },
    "shared": {
      "type": "directory",
      "children": {
        "route-metadata.ts": {
          "type": "file",
          "path": "shared/route-metadata.ts"
        },
        "schema.ts": {
          "type": "file",
          "path": "shared/schema.ts"
        }
      }
    }
  },
  "analysisTree": null
}