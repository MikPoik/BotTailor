import fs from 'fs';
import path from 'path';

const SOURCE_DIRS = ['server', 'client/src', 'shared'];
const OUTPUT_DIR = 'docs';

function extractComments(content: string): string {
  const lines = content.split('\n');
  let docs = '';
  let inMultiline = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Header/Multiline comments
    if (trimmed.startsWith('/**') || trimmed.startsWith('/*')) {
      inMultiline = true;
      docs += trimmed.replace(/^\/\*\*?/, '').replace(/\*\/$/, '') + '\n';
      if (trimmed.endsWith('*/')) inMultiline = false;
      continue;
    }
    if (inMultiline) {
      docs += trimmed.replace(/^\*/, '').replace(/\*\/$/, '') + '\n';
      if (trimmed.endsWith('*/')) inMultiline = false;
      continue;
    }

    // Single line comments
    if (trimmed.startsWith('//')) {
      docs += trimmed.replace(/^\/\//, '').trim() + '\n';
    }
  }
  return docs.trim();
}

function traverse(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        traverse(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const docs = extractComments(content);

      if (docs) {
        const relativePath = path.relative(process.cwd(), fullPath);
        const outputPath = path.join(OUTPUT_DIR, relativePath + '.md');
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const mdContent = `# Documentation for ${relativePath}\n\n${docs}`;
        fs.writeFileSync(outputPath, mdContent);
      }
    }
  }
}

console.log('Generating documentation...');
SOURCE_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    traverse(dir);
  }
});
console.log('Documentation generated in /docs');
