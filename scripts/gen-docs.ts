import { execSync } from 'child_process';
import fs from 'fs';

console.log('Generating contextual documentation...');

try {
  // 1. Run AI Summary Generator
  console.log('Step 1: Running AI Summary Generator...');
  execSync('npx tsx scripts/ai-doc-gen.ts', { stdio: 'inherit' });

  // 2. Run AI Context (Legacy/Overview)
  console.log('Step 2: Running AI Context Mapper...');
  execSync('npx tsx scripts/gen-ai-context.ts', { stdio: 'inherit' });

  console.log('All documentation tasks completed.');
} catch (error) {
  console.error('Error during documentation generation:', error);
  process.exit(1);
}
