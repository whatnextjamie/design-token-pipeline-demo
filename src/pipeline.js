/**
 * Main Token Pipeline Script
 *
 * Orchestrates the complete token pipeline workflow:
 * 1. Extract tokens from Figma (mock or real API)
 * 2. Normalize token structure
 * 3. Write to intermediate JSON
 * 4. Run Style Dictionary build
 * 5. Generate documentation
 * 6. Log summary with statistics
 */

import { extractTokens } from './extract/index.js';
import StyleDictionary from 'style-dictionary';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

/**
 * Main pipeline execution
 * @param {Object} options - Pipeline options
 * @param {string} options.method - 'mock' or 'figma' extraction method
 * @param {string} options.fileKey - Figma file key (if using real API)
 * @returns {Promise<Object>} - Pipeline results
 */
export async function runPipeline(options = {}) {
  const { method = 'mock', fileKey } = options;

  console.log(chalk.bold.blue('\n🚀 Design Token Pipeline'));
  console.log(chalk.gray('═'.repeat(60)));
  console.log(chalk.gray(`Started: ${new Date().toLocaleString()}\n`));

  const startTime = Date.now();
  const results = {
    success: false,
    steps: {},
    statistics: {},
    errors: []
  };

  let spinner = ora();

  try {
    // Step 1: Extract tokens from Figma
    spinner.start(chalk.blue('Step 1/6: Extracting tokens from Figma'));
    const extractStart = Date.now();

    const tokens = await extractTokens({ method, fileKey });

    const extractTime = Date.now() - extractStart;
    results.steps.extract = {
      success: true,
      duration: extractTime,
      tokenCount: countTokens(tokens)
    };

    spinner.succeed(chalk.green(`Step 1/6: Extracted ${results.steps.extract.tokenCount} tokens (${extractTime}ms)`));

    // Step 2: Write normalized tokens to intermediate JSON
    spinner.start(chalk.blue('Step 2/6: Writing intermediate token file'));
    const writeStart = Date.now();

    const outputPath = path.join(process.cwd(), 'output', 'extracted-tokens.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(tokens, null, 2));

    const writeTime = Date.now() - writeStart;
    results.steps.write = {
      success: true,
      duration: writeTime,
      path: outputPath
    };

    spinner.succeed(chalk.green(`Step 2/6: Wrote tokens to intermediate file (${writeTime}ms)`));

    // Step 3: Load Style Dictionary configuration
    spinner.start(chalk.blue('Step 3/6: Loading Style Dictionary configuration'));
    const configStart = Date.now();

    const config = await import('../style-dictionary.config.js');
    const sd = new StyleDictionary(config.default);

    const configTime = Date.now() - configStart;
    results.steps.config = {
      success: true,
      duration: configTime
    };

    spinner.succeed(chalk.green(`Step 3/6: Loaded configuration (${configTime}ms)`));

    // Step 4: Run Style Dictionary build
    spinner.start(chalk.blue('Step 4/6: Building platform outputs'));
    const buildStart = Date.now();

    await sd.buildAllPlatforms();

    const buildTime = Date.now() - buildStart;
    results.steps.build = {
      success: true,
      duration: buildTime
    };

    spinner.succeed(chalk.green(`Step 4/6: Built platform outputs (${buildTime}ms)`));

    // Step 5: Generate statistics
    spinner.start(chalk.blue('Step 5/6: Generating statistics'));
    const statsStart = Date.now();

    const statistics = await generateStatistics(tokens);
    results.statistics = statistics;

    const statsTime = Date.now() - statsStart;
    results.steps.statistics = {
      success: true,
      duration: statsTime
    };

    spinner.succeed(chalk.green(`Step 5/6: Generated statistics (${statsTime}ms)`));

    // Step 6: Verify outputs
    spinner.start(chalk.blue('Step 6/6: Verifying generated files'));
    const verifyStart = Date.now();

    const generatedFiles = await verifyOutputs();

    const verifyTime = Date.now() - verifyStart;
    results.steps.verify = {
      success: true,
      duration: verifyTime,
      fileCount: generatedFiles.length
    };

    spinner.succeed(chalk.green(`Step 6/6: Verified ${generatedFiles.length} output files (${verifyTime}ms)`));

    // Success!
    results.success = true;
    const totalTime = Date.now() - startTime;

    // Print summary
    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.bold.green('✓ Pipeline completed successfully!\n'));

    printSummary(results, totalTime, generatedFiles);

  } catch (error) {
    spinner.fail(chalk.red('Pipeline failed'));
    results.errors.push(error.message);

    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.bold.red('✗ Pipeline failed\n'));
    console.error(chalk.red('Error:'), error.message);

    if (error.stack) {
      console.log(chalk.gray('\nStack trace:'));
      console.log(chalk.gray(error.stack));
    }

    throw error;
  }

  return results;
}

/**
 * Count total tokens in nested structure
 */
function countTokens(obj, count = 0) {
  if (!obj || typeof obj !== 'object') return count;

  for (const key in obj) {
    if (key === '$metadata') continue;

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

/**
 * Generate statistics about the tokens
 */
async function generateStatistics(tokens) {
  const stats = {
    total: 0,
    byCategory: {},
    byType: {}
  };

  function traverse(obj, category = '') {
    for (const key in obj) {
      if (key === '$metadata') continue;

      const value = obj[key];

      if (value && typeof value === 'object') {
        if (value.value !== undefined) {
          // This is a token
          stats.total++;

          const cat = category || 'other';
          stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

          const type = value.type || 'unknown';
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        } else {
          // Recurse into nested structure
          const nextCategory = category || key;
          traverse(value, nextCategory);
        }
      }
    }
  }

  traverse(tokens);

  return stats;
}

/**
 * Verify output files were generated
 */
async function verifyOutputs() {
  const expectedFiles = [
    'output/css/variables.css',
    'output/css/tokens.css',
    'output/js/tokens.js',
    'output/js/tokens.module.js',
    'output/scss/_variables.scss',
    'output/json/tokens.json',
    'output/json/tokens-flat.json',
    'output/docs/tokens-documentation.json',
    'output/docs/tokens-documentation.md',
    'output/docs/tokens-documentation.html',
    'output/android/colors.xml',
    'output/android/dimens.xml',
    'output/ios/StyleDictionaryColor.swift'
  ];

  const generatedFiles = [];

  for (const file of expectedFiles) {
    try {
      await fs.access(file);
      const stats = await fs.stat(file);
      generatedFiles.push({
        path: file,
        size: stats.size
      });
    } catch {
      // File doesn't exist, skip it
    }
  }

  return generatedFiles;
}

/**
 * Print pipeline summary
 */
function printSummary(results, totalTime, generatedFiles) {
  console.log(chalk.bold('📊 Pipeline Summary\n'));

  // Token statistics
  console.log(chalk.cyan('Tokens Processed:'));
  console.log(chalk.gray(`  Total: ${results.statistics.total} tokens\n`));

  if (Object.keys(results.statistics.byCategory).length > 0) {
    console.log(chalk.cyan('By Category:'));
    Object.entries(results.statistics.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(chalk.gray(`  ${category}: ${count} tokens`));
      });
    console.log();
  }

  if (Object.keys(results.statistics.byType).length > 0) {
    console.log(chalk.cyan('By Type:'));
    Object.entries(results.statistics.byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(chalk.gray(`  ${type}: ${count} tokens`));
      });
    console.log();
  }

  // Generated files
  console.log(chalk.cyan('Generated Files:'));
  console.log(chalk.gray(`  ${generatedFiles.length} files created\n`));

  // Group files by directory
  const filesByDir = {};
  generatedFiles.forEach(file => {
    const dir = path.dirname(file.path).split('/').pop();
    if (!filesByDir[dir]) filesByDir[dir] = [];
    filesByDir[dir].push(file);
  });

  Object.entries(filesByDir).forEach(([dir, files]) => {
    console.log(chalk.gray(`  ${dir}/`));
    files.forEach(file => {
      const fileName = path.basename(file.path);
      const sizeKB = (file.size / 1024).toFixed(2);
      console.log(chalk.gray(`    • ${fileName} (${sizeKB} KB)`));
    });
  });

  console.log();

  // Timing
  console.log(chalk.cyan('Performance:'));
  Object.entries(results.steps).forEach(([step, data]) => {
    if (data.success) {
      console.log(chalk.gray(`  ${step}: ${data.duration}ms`));
    }
  });
  console.log(chalk.gray(`  total: ${totalTime}ms`));

  console.log(chalk.gray('\n' + '═'.repeat(60) + '\n'));
}

/**
 * CLI entry point
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {
      method: args.includes('--figma') ? 'figma' : 'mock',
      fileKey: args.find(arg => arg.startsWith('--file='))?.split('=')[1]
    };

    await runPipeline(options);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
