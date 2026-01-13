import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { execSync } from 'child_process';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const DOCS_DIR = 'docs/ai-summaries';
const DOMAINS_DIR = 'docs/domains';
const TRACKING_FILE = 'docs/.doc-tracking.json';
const SOURCE_DIRS = ['server', 'client/src', 'shared'];

interface TrackingData {
  [filePath: string]: number; // mtime
}

const DOMAIN_MAP: { [key: string]: string[] } = {
  'AUTH_SYSTEM': ['server/routes/auth.ts', 'server/neonAuth.ts', 'client/src/hooks/useAuth.ts']
};

async function generateSummary(filePath: string, content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a technical documentation assistant. Summarize the following code file's purpose, key functions, and dependencies in concise markdown. Focus on architectural context and how it interacts with other files."
        },
        {
          role: "user",
          content: `File: ${filePath}\n\nCode:\n${content.slice(0, 4000)}`
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

async function synthesizeDomain(domainName: string, summaries: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior software architect. Given a set of file summaries for a functional domain, synthesize them into a single, cohesive architectural overview. Explain the data flow, main responsibilities, and how this domain connects to others."
        },
        {
          role: "user",
          content: `Domain: ${domainName}\n\nSummaries:\n${summaries.join('\n\n---\n\n')}`
        }
      ],
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Failed to synthesize domain ${domainName}:`, error);
    return null;
  }
}

async function run() {
  console.log('Starting Enhanced AI-powered documentation generation...');
  
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  if (!fs.existsSync(DOMAINS_DIR)) fs.mkdirSync(DOMAINS_DIR, { recursive: true });
  
  let tracking: TrackingData = {};
  if (fs.existsSync(TRACKING_FILE)) {
    tracking = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
  }

  const newTracking: TrackingData = { ...tracking };
  const domainSummaries: { [key: string]: string[] } = {};

  const targetFiles = Object.values(DOMAIN_MAP).flat();

  for (const file of targetFiles) {
    if (!fs.existsSync(file)) {
      // Check if it's a directory
      if (fs.existsSync(file.replace(/\.ts(x)?$/, '')) && fs.statSync(file.replace(/\.ts(x)?$/, '')).isDirectory()) {
        const dirFiles = execSync(`find ${file.replace(/\.ts(x)?$/, '')} -name "*.ts" -o -name "*.tsx"`).toString().split('\n').filter(Boolean);
        for (const dirFile of dirFiles) {
          await processFile(dirFile, tracking, newTracking, domainSummaries);
        }
      }
      continue;
    }
    await processFile(file, tracking, newTracking, domainSummaries);
  }

  console.log('Synthesizing domains...');
  for (const [domain, summaries] of Object.entries(domainSummaries)) {
    console.log(`Synthesizing ${domain}...`);
    const domainSummary = await synthesizeDomain(domain, summaries);
    if (domainSummary) {
      fs.writeFileSync(path.join(DOMAINS_DIR, `${domain}.md`), `# Domain Summary: ${domain}\n\n${domainSummary}`);
    }
  }

  fs.writeFileSync(TRACKING_FILE, JSON.stringify(newTracking, null, 2));
  console.log('AI Documentation and Domain Synthesis complete.');
}

async function processFile(file: string, tracking: any, newTracking: any, domainSummaries: any) {
  const stats = fs.statSync(file);
  const mtime = stats.mtimeMs;
  const outputPath = path.join(DOCS_DIR, `${file}.md`);

  let summaryContent: string | null = null;

  if (!tracking[file] || tracking[file] < mtime || !fs.existsSync(outputPath)) {
    console.log(`Processing ${file}...`);
    const content = fs.readFileSync(file, 'utf-8');
    summaryContent = await generateSummary(file, content);

    if (summaryContent) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outputPath, `# AI Summary: ${file}\n\n${summaryContent}`);
      newTracking[file] = mtime;
    }
  } else {
    summaryContent = fs.readFileSync(outputPath, 'utf-8');
  }

  if (summaryContent) {
    for (const [domain, paths] of Object.entries(DOMAIN_MAP)) {
      if (paths.some(p => file.startsWith(p))) {
        if (!domainSummaries[domain]) domainSummaries[domain] = [];
        domainSummaries[domain].push(summaryContent);
      }
    }
  }
}

run().catch(console.error);
