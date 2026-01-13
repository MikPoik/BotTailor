import { execSync } from 'child_process';
import fs from 'fs';

console.log('Generating contextual documentation using TypeDoc...');

try {
  // Use typedoc to generate high-quality markdown docs
  execSync('npx typedoc', { stdio: 'inherit' });
  console.log('Documentation generated successfully in /docs');
} catch (error) {
  console.error('Error generating documentation:', error);
  process.exit(1);
}
