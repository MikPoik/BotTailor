
# BotTailor

Smart AI Chatbots Made Simple - A full-stack React application for creating and embedding intelligent AI chatbots on any website. Built with Express.js backend and React frontend, featuring customizable UI, rich messaging, and seamless integration.

## Features

### 🤖 AI-Powered Chatbots
- **Advanced Language Models**: Powered by OpenAI GPT-4.1 for natural conversations
- **Configurable AI Settings**: Customize temperature, max tokens, and system prompts
- **Context-Aware Responses**: Maintains conversation context and understanding
- **Streaming Responses**: Real-time message delivery for better user experience

### 🎨 Customizable UI
- **Complete Theme Control**: Primary, background, and text color customization
- **Background Images**: Custom background support with readability overlays
- **Avatar Upload**: Custom chatbot avatars with URL-based configuration
- **Responsive Design**: Mobile-first design that works on all devices
- **Position Control**: Bottom-right or bottom-left widget positioning

### 💬 Rich Messaging
- **Interactive Cards**: Rich content with images, titles, and action buttons
- **Menu Options**: Category-based navigation and quick actions
- **Quick Replies**: Pre-defined response options for users
- **Form Integration**: Contact forms with email notifications
- **Survey Builder**: Interactive surveys and data collection

### 🔧 Easy Integration
- **Simple Embed Code**: One-script integration for any website
- **Cross-Origin Support**: Works on any domain with CORS configuration
- **Real-time Updates**: HTTP polling for message synchronization
- **Widget Testing**: Built-in testing tools and live preview

### 📊 Data Management
- **Website Scanning**: Automatically learn from website content
- **File Uploads**: Support for documents, PDFs, and text files
- **Manual Content**: Direct knowledge base entry
- **Analytics**: Conversation tracking and user interaction analytics

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon Database recommended)
- OpenAI API key

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
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=development
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

1. **Sign Up/Login**: Use Replit Authentication to access the platform
2. **Create Chatbot**: Navigate to "New Chatbot" and configure:
   - Basic settings (name, description)
   - AI configuration (model, temperature, system prompt)
   - UI customization (colors, avatar, background)
3. **Add Knowledge**: Upload files, scan websites, or add manual content
4. **Test & Deploy**: Use the built-in tester, then get your embed code

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
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js + TypeScript, Node.js with ESM
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui built on Radix UI primitives
- **State Management**: TanStack Query for server state
- **Authentication**: Replit Auth with OpenID Connect

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express.js backend
│   ├── routes/             # API route handlers
│   ├── openai/             # OpenAI integration
│   └── db.ts               # Database configuration
├── public/                 # Static files and embed scripts
└── shared/                 # Shared types and schemas
```

### Database Schema
- **Users**: Authentication and user management
- **Chatbots**: Chatbot configurations and settings
- **Chat Sessions**: Individual chat sessions
- **Messages**: Rich message content with JSON metadata
- **Surveys**: Interactive forms and survey data

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
- `/api/auth/*` - Authentication routes
- `/api/chatbots/*` - Chatbot CRUD operations
- `/api/chat/*` - Chat session and messaging
- `/api/public/*` - Public chatbot data
- `/widget/:userId/:chatbotGuid` - Embed widget endpoint

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Replit Deployment
This application is optimized for Replit deployment with:
- Automatic dependency installation
- Environment variable management via Secrets
- Built-in database integration with Neon
- One-click deployment to production

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

## Recent Updates

- **Avatar Upload**: Custom avatar support with URL-based configuration
- **Enhanced Theming**: Complete color customization system
- **Improved Analytics**: Conversation tracking and user metrics
- **Survey Builder**: Interactive forms and data collection tools
- **Mobile Optimization**: Enhanced mobile chat experience

---

Built with ❤️ by BotTailor for seamless AI-powered customer engagement.
