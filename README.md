
# BotTailor

Smart AI Chatbots Made Simple - A full-stack React application for creating and embedding intelligent AI chatbots on any website. Built with Express.js backend and React frontend, featuring customizable UI, rich messaging, and seamless integration.

## Features

### 🤖 AI-Powered Chatbots
- **Advanced Language Models**: Powered by OpenAI GPT-4o (configurable per chatbot)
- **Configurable AI Settings**: Customize model, temperature (0-10 scale), max tokens, and system prompts
- **RAG System**: Semantic search over website content using pgvector embeddings
- **Context-Aware Responses**: Includes conversation history, website knowledge, and active survey context
- **Streaming Responses**: Real-time message delivery with server-sent events
- **AI Assistants**: Built-in prompt and survey generation assistants

### 🎨 Customizable UI
- **Complete Theme Control**: Primary, background, and text color customization
- **Background Images**: Custom background support with readability overlays
- **Avatar Upload**: Custom chatbot avatars with URL-based configuration
- **Responsive Design**: Mobile-first design that works on all devices
- **Position Control**: Bottom-right or bottom-left widget positioning

### 💬 Rich Messaging
- **Interactive Cards**: Rich content with images, titles, and action buttons
- **Menu Options**: Single and multi-select menus with icons
- **Quick Replies**: Pre-defined response options for users
- **Rating Messages**: Star, number, and scale rating support
- **Form Integration**: Contact forms with email notifications via configured SMTP
- **Survey System**: Visual builder, conditional flow, AI-powered generation, and analytics

### 🔧 Easy Integration
- **Simple Embed Code**: One-script integration for any website
- **Cross-Origin Support**: Works on any domain with CORS configuration
- **Real-time Updates**: HTTP polling for message synchronization
- **Widget Testing**: Built-in testing tools and live preview

### 📊 Data Management & Analytics
- **Website Scanning**: Automated scraping with Cheerio and Playwright
- **Vector Embeddings**: OpenAI ada-002 embeddings (1536 dimensions) stored in pgvector
- **File Uploads**: AWS S3 storage for documents, images, and avatars
- **Manual Content**: Direct text entry for knowledge base
- **Chat History**: Session tracking with pagination and search
- **Survey Analytics**: Response tracking, completion rates, and visualizations with Recharts

### 💳 Subscription & Billing
- **Stripe Integration**: Secure payment processing for subscription plans
- **Usage Tracking**: Messages per month and bot limits enforcement
- **Webhook Support**: Automated subscription lifecycle management
- **Plan Tiers**: Free, Basic, Premium, and Ultra plans with progressive features

## Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database with pgvector extension (Neon Database required)
- OpenAI API key
- Stack Auth project (for authentication)
- Stripe account (for subscriptions)
- AWS S3 bucket (for file storage)
- SMTP credentials (optional, for email notifications)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-username/ai-chatbot-widget.git
   cd ai-chatbot-widget
   npm install
   ```

2. **Environment Setup**
   Set up your environment variables in Replit Secrets or `.env`:
   ```
   # Database (Neon with pgvector support)
   DATABASE_URL=your_neon_postgresql_connection_string
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Stack Auth
   NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
   STACK_SECRET_SERVER_KEY=your_stack_secret_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # AWS S3
   AWS_REGION=your_aws_region
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET=your_s3_bucket_name
   
   # Application
   NODE_ENV=development
   APP_URL=http://localhost:5000
   ```

3. **Database Setup**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://0.0.0.0:5000`

## Usage

### Creating Your First Chatbot

1. **Sign Up/Login**: Authenticate with Stack Auth (email/password or OAuth)
2. **Subscribe**: Select a subscription plan (Free tier available)
3. **Create Chatbot**: Navigate to "New Chatbot" and configure:
   - Basic settings (name, description, avatar)
   - AI configuration (model selection, temperature 0-10, max tokens, system prompt)
   - UI customization (colors, background image, theme)
   - Email settings (for form submissions)
4. **Design Home Screen**: Use UI Designer to create custom layouts with topics and quick actions
5. **Add Knowledge**: Upload files to S3, scan websites, or add manual text content
6. **Build Surveys**: Create interactive surveys with conditional logic
7. **Test & Deploy**: Use the built-in tester, then get your embed code

### Embedding on Your Website

Add this code snippet to your website:

```html
<script src="https://your-repl-url.replit.dev/embed.js"></script>
<script>
  ChatWidget.init({
    chatbotId: 'YOUR_CHATBOT_GUID',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937'
  });
</script>
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Wouter (routing)
- **Backend**: Express.js + TypeScript, Node.js with ESM modules
- **Database**: Neon PostgreSQL (serverless) with Drizzle ORM and pgvector
- **UI Components**: shadcn/ui built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: Stack Auth with custom middleware wrapper
- **AI/ML**: OpenAI API (GPT-4o, ada-002 embeddings)
- **Payments**: Stripe for subscriptions and billing
- **Storage**: AWS S3 for file uploads
- **Scraping**: Cheerio (static) and Playwright (dynamic content)
- **Analytics**: Recharts for data visualization


### Database Schema
- **neon_auth.users_sync**: Stack Auth managed user table (read-only)
- **users**: App-specific user data (references Stack Auth by ID)
- **chatbot_configs**: Chatbot settings, AI config, UI design, email settings
- **chat_sessions**: Conversation sessions with active survey tracking
- **messages**: Rich message content with type-specific JSON metadata
- **website_sources**: Scraped websites, uploaded files, text content
- **website_content**: Chunked content with 1536-dim vector embeddings
- **surveys**: Survey definitions with JSON configuration
- **survey_sessions**: User progress and responses
- **subscription_plans**: Plan definitions with Stripe IDs and limits
- **subscriptions**: User subscriptions with usage tracking

## Configuration Options

### Chatbot Settings
- **Model Configuration**: Temperature (0.0-1.0), max tokens, system prompts
- **UI Customization**: Colors, fonts, background images, avatars
- **Behavior**: Welcome messages, fallback responses, active/inactive states
- **Integration**: Email notifications, form handling, survey collection

### Embed Widget Options
- `chatbotId`: Your chatbot's unique GUID identifier
- `position`: 'bottom-right' or 'bottom-left'
- `primaryColor`: Hex color for buttons and accents
- `backgroundColor`: Chat interface background color
- `textColor`: Main text color
- `welcomeMessage`: Custom greeting message

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### API Endpoints
- `/api/ensure-user` - Stack Auth user sync to app database
- `/api/chatbots/*` - Chatbot CRUD, model settings, config management
- `/api/chat/*` - Chat sessions, messaging, AI responses, streaming
- `/api/surveys/*` - Survey builder, sessions, analytics, AI assistance
- `/api/public/*` - Public chatbot access (no auth required)
- `/api/uploads/*` - File uploads to S3 (avatars, images, documents)
- `/api/websites/*` - Website scraping, content management, embeddings
- `/api/ui-designer/*` - Home screen configuration and preview
- `/api/contact/*` - Contact form submissions with email
- `/api/subscription/*` - Stripe checkout, plan management, usage tracking
- `/api/webhook` - Stripe webhook handler for subscription events
- `/widget` - Embedded chat widget (supports `?embedded=true`)

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Cloud Deployment
This application can be deployed to various platforms:
- **Fly.io**: Included `fly.toml` configuration
- **Replit**: Optimized with automatic dependency installation
- **Vercel/Railway**: Compatible with Node.js hosting
- **Docker**: Dockerfile included for containerized deployment

Requirements for production:
- PostgreSQL database with pgvector extension (Neon recommended)
- Environment variables configured
- Stripe webhooks endpoint configured
- S3 bucket for file storage

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Comprehensive guides available in the app
- **Issues**: Report bugs and request features via GitHub issues
- **Community**: Join our community for support and discussions

## Key Features Breakdown

### Message Types
- **Text**: Plain text with optional streaming support
- **Card**: Rich cards with images, titles, descriptions, and action buttons
- **Menu**: Single-select menus with icons and custom actions
- **Multiselect**: Multiple selection menus with min/max constraints
- **Rating**: Star ratings, number scales, or visual scales
- **Form**: Multi-field forms with validation and email submission
- **Quick Replies**: Suggested response buttons

### Home Screen UI Designer
- **Component-Based**: Header, category tabs, topic grids, quick actions, footer
- **Dynamic Topics**: Link to messages or surveys with custom actions
- **Visual Customization**: Background images, colors, transparency controls
- **Responsive Layouts**: Grid, list, or carousel display modes

### RAG (Retrieval-Augmented Generation)
- **Website Scraping**: Automatic content extraction from URLs and sitemaps
- **Vector Search**: Semantic similarity search using OpenAI embeddings
- **Context Building**: Top 5 relevant chunks included in AI prompts
- **Multi-Source**: Combine website content, uploaded files, and manual text

### Survey System
- **Question Types**: Single choice, multiple choice, text input, ratings
- **Conditional Flow**: Skip logic and branching based on responses
- **AI Generation**: Automated survey creation for common use cases
- **Analytics Dashboard**: Completion rates, response visualization, session tracking

---

Built with ❤️ by BotTailor for seamless AI-powered customer engagement.
