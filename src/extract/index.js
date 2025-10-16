/**
 * Token Extraction Module
 * Main entry point for extracting design tokens from Figma
 * Supports both mock data (for demo) and real Figma API
 */

import * as mockApi from './mock-figma-api.js';
import * as realApi from './figma-api.js';
import { normalizeTokens } from './normalize.js';
import chalk from 'chalk';

/**
 * Extract tokens using the specified method
 * @param {Object} options - Extraction options
 * @param {string} options.method - 'mock' or 'figma'
 * @param {string} options.fileKey - Figma file key (required if method is 'figma')
 * @returns {Promise<Object>} - Normalized tokens
 */
export async function extractTokens(options = {}) {
  const { method = 'mock', fileKey } = options;

  console.log(chalk.blue('🎨 Starting token extraction...'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray(`   Method: ${method}`));

  let rawData;

  try {
    if (method === 'figma') {
      // Use real Figma API
      if (!fileKey) {
        throw new Error('fileKey is required when using Figma API');
      }
      rawData = await realApi.fetchFileTokens(fileKey);
    } else {
      // Use mock data
      rawData = await mockApi.fetchFileStyles();
    }

    // Normalize the tokens
    const normalizedTokens = normalizeTokens(rawData);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green('✓ Token extraction complete!'));

    return normalizedTokens;

  } catch (error) {
    console.log(chalk.gray('─'.repeat(50)));
    console.error(chalk.red('✗ Token extraction failed'));
    throw error;
  }
}

/**
 * Validate Figma API connection (for real API only)
 * @returns {Promise<boolean>} - True if connection is valid
 */
export async function validateFigmaConnection() {
  return await realApi.validateToken();
}

// Re-export useful functions
export { normalizeTokens } from './normalize.js';
export { getTokenStats } from './mock-figma-api.js';
