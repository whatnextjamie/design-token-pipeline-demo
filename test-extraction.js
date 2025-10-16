/**
 * Test script to demonstrate token extraction
 * Run with: node test-extraction.js
 */

import { extractTokens } from './src/extract/index.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    console.log('\n🚀 Testing Token Extraction\n');

    // Extract tokens using mock API
    const tokens = await extractTokens({ method: 'mock' });

    // Display some results
    console.log('\n📊 Extraction Results:');
    console.log('─'.repeat(50));

    // Count tokens
    const colorCount = countTokens(tokens.colors);
    const typographyCount = Object.values(tokens.typography).reduce(
      (sum, category) => sum + countTokens(category), 0
    );
    const effectCount = countTokens(tokens.effects);

    console.log(`Colors: ${colorCount} tokens`);
    console.log(`Typography: ${typographyCount} tokens`);
    console.log(`Effects: ${effectCount} tokens`);
    console.log(`Total: ${colorCount + typographyCount + effectCount} tokens`);

    // Show sample tokens
    console.log('\n📝 Sample Color Tokens:');
    console.log('─'.repeat(50));
    showSampleTokens(tokens.colors, 5);

    console.log('\n📝 Sample Typography Tokens:');
    console.log('─'.repeat(50));
    if (tokens.typography.fontSize) {
      showSampleTokens(tokens.typography.fontSize, 3);
    }

    // Save to output file
    const outputPath = path.join(process.cwd(), 'output', 'extracted-tokens.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(tokens, null, 2));

    console.log('\n✅ Success!');
    console.log(`Extracted tokens saved to: ${outputPath}`);
    console.log('\nYou can view the full output in: output/extracted-tokens.json\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Helper function to count tokens in nested structure
function countTokens(obj, count = 0) {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      if (obj[key].value !== undefined) {
        count++;
      } else {
        count = countTokens(obj[key], count);
      }
    }
  }
  return count;
}

// Helper function to show sample tokens
function showSampleTokens(obj, limit = 5, prefix = '', count = { current: 0 }) {
  for (const key in obj) {
    if (count.current >= limit) break;

    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (obj[key] && typeof obj[key] === 'object') {
      if (obj[key].value !== undefined) {
        console.log(`  ${fullKey}: ${obj[key].value}`);
        count.current++;
      } else {
        showSampleTokens(obj[key], limit, fullKey, count);
      }
    }
  }
}

main();
