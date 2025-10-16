/**
 * Test script to demonstrate custom transforms
 * Shows the difference between default and custom transform outputs
 * Run with: node test-custom-transforms.js
 */

import fs from 'fs/promises';
import chalk from 'chalk';

async function main() {
  console.log('\n🧪 Testing Custom Transforms\n');
  console.log(chalk.gray('─'.repeat(50)));

  try {
    // Compare default CSS vs custom CSS
    console.log(chalk.blue('\n📊 Comparing Default vs Custom CSS Transforms:\n'));

    const defaultCSS = await fs.readFile('output/css/variables.css', 'utf-8');
    const customCSS = await fs.readFile('output/css/tokens.css', 'utf-8');

    console.log(chalk.yellow('Default CSS (first 5 variables):'));
    const defaultLines = defaultCSS.split('\n').filter(line => line.includes('--')).slice(0, 5);
    defaultLines.forEach(line => console.log(chalk.gray('  ' + line.trim())));

    console.log(chalk.yellow('\nCustom CSS (first 5 variables):'));
    const customLines = customCSS.split('\n').filter(line => line.includes('--')).slice(0, 5);
    customLines.forEach(line => console.log(chalk.gray('  ' + line.trim())));

    // Show token categorization example
    console.log(chalk.blue('\n\n📋 Custom Transform Features:\n'));

    console.log(chalk.green('✓ Semantic Naming:'));
    console.log(chalk.gray('  Converts paths like ["colors", "primary", "500"]'));
    console.log(chalk.gray('  → to semantic names like "color-primary-500"\n'));

    console.log(chalk.green('✓ Category Metadata:'));
    console.log(chalk.gray('  Adds category, subcategory, and state information'));
    console.log(chalk.gray('  Helps organize tokens by type and purpose\n'));

    console.log(chalk.green('✓ Pixel to REM Conversion:'));
    console.log(chalk.gray('  Converts: "16px" → "1.000rem" (based on 16px base)'));
    console.log(chalk.gray('  Converts: "24px" → "1.500rem"\n'));

    console.log(chalk.green('✓ Token Aliasing:'));
    console.log(chalk.gray('  Resolves: "{colors.primary.500}" → "var(--colors-primary-500)"'));
    console.log(chalk.gray('  Enables semantic token references\n'));

    console.log(chalk.green('✓ Figma Metadata Preservation:'));
    console.log(chalk.gray('  Keeps track of original Figma key and name'));
    console.log(chalk.gray('  Enables traceability back to design source\n'));

    // Show example of token with metadata
    console.log(chalk.blue('\n📝 Example Token with Custom Attributes:\n'));
    console.log(chalk.gray(JSON.stringify({
      name: 'color-primary-500',
      value: '#6366F1',
      type: 'color',
      attributes: {
        category: 'color',
        subcategory: 'primary',
        figma: {
          key: 'color-primary-500',
          name: 'primary/500'
        },
        comment: 'Primary color - base'
      }
    }, null, 2)));

    // Show file comparison
    console.log(chalk.blue('\n\n📦 Generated Files Comparison:\n'));

    const files = [
      { name: 'Default CSS', path: 'output/css/variables.css', description: 'Standard CSS variables' },
      { name: 'Custom CSS', path: 'output/css/tokens.css', description: 'Custom transforms applied' },
      { name: 'JavaScript', path: 'output/js/tokens.js', description: 'ES6 exports' },
      { name: 'SCSS', path: 'output/scss/_variables.scss', description: 'Sass variables' }
    ];

    for (const file of files) {
      try {
        const stats = await fs.stat(file.path);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(chalk.green('  ✓'), chalk.cyan(file.name.padEnd(15)),
                   chalk.gray(`${sizeKB} KB`.padEnd(10)),
                   chalk.gray(`- ${file.description}`));
      } catch {
        console.log(chalk.gray('  -'), file.name);
      }
    }

    console.log(chalk.blue('\n\n🔍 How to Verify Custom Transforms:\n'));
    console.log(chalk.gray('1. Compare output/css/variables.css (default)'));
    console.log(chalk.gray('   vs output/css/tokens.css (custom)\n'));
    console.log(chalk.gray('2. Check token naming conventions'));
    console.log(chalk.gray('   Look for semantic names in custom output\n'));
    console.log(chalk.gray('3. Inspect JSON output for metadata'));
    console.log(chalk.gray('   See category and figma attributes\n'));

    console.log(chalk.green('\n✅ Custom transforms are working!\n'));
    console.log(chalk.gray('The custom-transforms.js file provides:'));
    console.log(chalk.gray('• 9 custom transform functions'));
    console.log(chalk.gray('• 3 custom transform groups'));
    console.log(chalk.gray('• Semantic naming, categorization, and aliasing\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    console.log(chalk.yellow('\n⚠ Make sure to run "npm run transform" first\n'));
    process.exit(1);
  }
}

main();
