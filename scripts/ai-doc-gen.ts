import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { execSync } from 'child_process';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const DOCS_DIR = 'docs/ai-summaries';
const TRACKING_FILE = 'docs/.doc-tracking.json';
const SOURCE_DIRS = ['server', 'client/src', 'shared'];

interface TrackingData {
  [filePath: string]: number; // mtime
}

async function generateSummary(filePath: string, content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a technical documentation assistant. Summarize the following code file's purpose, key functions, and dependencies in concise markdown. Focus on architectural context."
        },
        {
          role: "user",
          content: `File: ${filePath}\n\nCode:\n${content.slice(0, 4000)}` // Limit context
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Failed to generate summary for ${filePath}:`, error);
    return null;
  }
}

async function run() {
  console.log('Starting AI-powered documentation generation...');
  
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  
  let tracking: TrackingData = {};
  if (fs.existsSync(TRACKING_FILE)) {
    tracking = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
  }

  const newTracking: TrackingData = { ...tracking };
  let updatedCount = 0;

  for (const dir of SOURCE_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const files = execSync(`find ${dir} -name "*.ts" -o -name "*.tsx"`).toString().split('\n').filter(Boolean);

    for (const file of files) {
      const stats = fs.statSync(file);
      const mtime = stats.mtimeMs;

      if (!tracking[file] || tracking[file] < mtime) {
        console.log(`Processing ${file}...`);
        const content = fs.readFileSync(file, 'utf-8');
        const summary = await generateSummary(file, content);

        if (summary) {
          const outputPath = path.join(DOCS_DIR, `${file}.md`);
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
          
          fs.writeFileSync(outputPath, `# AI Summary: ${file}\n\n${summary}`);
          newTracking[file] = mtime;
          updatedCount++;
        }
      }
    }
  }

  fs.writeFileSync(TRACKING_FILE, JSON.stringify(newTracking, null, 2));
  console.log(`AI Documentation complete. Updated ${updatedCount} files.`);
}

run().catch(console.error);
