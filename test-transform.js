/**
 * Test script to demonstrate Style Dictionary transformation
 * Run with: node test-transform.js
 */

import StyleDictionary from 'style-dictionary';
import chalk from 'chalk';
import fs from 'fs/promises';

async function main() {
  try {
    console.log('\n🎨 Testing Style Dictionary Transformation\n');
    console.log(chalk.gray('─'.repeat(50)));

    // Check if extracted tokens exist
    try {
      await fs.access('output/extracted-tokens.json');
      console.log(chalk.green('✓ Found extracted tokens'));
    } catch {
      console.log(chalk.yellow('⚠ No extracted tokens found'));
      console.log(chalk.gray('  Run "npm run extract" first to generate tokens\n'));
      process.exit(1);
    }

    // Load the Style Dictionary config
    const config = await import('./style-dictionary.config.js');

    console.log(chalk.blue('📦 Building Style Dictionary outputs...'));
    console.log(chalk.gray('─'.repeat(50)));

    // Build the Style Dictionary
    const sd = new StyleDictionary(config.default);
    await sd.buildAllPlatforms();

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green('✓ Style Dictionary build complete!\n'));

    // Show generated files
    console.log(chalk.blue('📄 Generated Files:'));
    console.log(chalk.gray('─'.repeat(50)));

    const outputs = [
      'output/css/variables.css',
      'output/js/tokens.js',
      'output/js/tokens.module.js',
      'output/scss/_variables.scss',
      'output/json/tokens.json',
      'output/json/tokens-flat.json',
      'output/android/colors.xml',
      'output/android/dimens.xml',
      'output/ios/StyleDictionaryColor.swift'
    ];

    for (const file of outputs) {
      try {
        const stats = await fs.stat(file);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(chalk.green('  ✓'), file, chalk.gray(`(${sizeKB} KB)`));
      } catch {
        console.log(chalk.gray('  -'), file, chalk.gray('(not generated)'));
      }
    }

    // Show sample output from CSS file
    console.log('\n' + chalk.blue('📝 Sample CSS Output:'));
    console.log(chalk.gray('─'.repeat(50)));

    try {
      const cssContent = await fs.readFile('output/css/variables.css', 'utf-8');
      const lines = cssContent.split('\n').slice(0, 15);
      console.log(chalk.gray(lines.join('\n')));
      console.log(chalk.gray('  ... (truncated)\n'));
    } catch (error) {
      console.log(chalk.yellow('  Could not read CSS file\n'));
    }

    console.log(chalk.green('✅ Success!'));
    console.log(chalk.gray('Check the output/ directory for all generated files.\n'));

  } catch (error) {
    console.error('\n' + chalk.red('❌ Error:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

main();
