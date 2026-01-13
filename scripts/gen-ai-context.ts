import fs from 'fs';
import path from 'path';

/**
 * This script generates a consolidated AI_CONTEXT.md file that provides
 * a high-level overview of the codebase for AI agents.
 */

const CORE_FILES = [
  { path: 'server/index.ts', description: 'Server entry point and middleware configuration' },
  { path: 'server/storage.ts', description: 'Database storage interface and implementation' },
  { path: 'shared/schema.ts', description: 'Database schema and type definitions' },
  { path: 'client/src/App.tsx', description: 'Frontend routing and main application structure' },
  { path: 'server/routes/chat.ts', description: 'Core chat logic and AI response handling' },
];

function generateAIContext() {
  console.log('Generating AI_CONTEXT.md...');
  
  let content = '# AI Context & Codebase Map\n\n';
  content += 'This file provides a high-level mapping of the codebase for AI agents to understand the system architecture and core flows.\n\n';
  
  content += '## Core Architecture\n';
  content += '- **Backend**: Express.js with Drizzle ORM (PostgreSQL via Neon).\n';
  content += '- **Frontend**: React with Vite, Tailwind CSS, and TanStack Query.\n';
  content += '- **Authentication**: Integrated with Replit Auth (Neon Auth).\n';
  content += '- **Real-time**: HTTP Polling for message synchronization.\n\n';
  
  content += '## Key Files & Responsibilities\n';
  
  for (const file of CORE_FILES) {
    if (fs.existsSync(file.path)) {
      const fileContent = fs.readFileSync(file.path, 'utf-8');
      // Extract first 50 lines for context
      const snippet = fileContent.split('\n').slice(0, 50).join('\n');
      
      content += `### ${file.path}\n`;
      content += `**Description**: ${file.description}\n\n`;
      content += '```typescript\n';
      content += snippet + '\n... [rest of file omitted]\n';
      content += '```\n\n';
    }
  }
  
  fs.writeFileSync('docs/AI_CONTEXT.md', content);
  console.log('AI_CONTEXT.md generated in /docs');
}

generateAIContext();
