import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * Mock Figma API - Simulates extracting design tokens from Figma
 * This reads from our sample-tokens.json file to simulate the Figma API response
 */

/**
 * Simulates fetching a Figma file's styles and variables
 * @param {string} fileId - The Figma file ID (not used in mock, but kept for API compatibility)
 * @returns {Promise<Object>} - Figma-style token data
 */
export async function fetchFileStyles(fileId = 'mock-file') {
  try {
    console.log(chalk.blue('📥 Fetching tokens from mock Figma API...'));

    // Read the sample tokens file
    const inputPath = path.join(process.cwd(), 'input', 'sample-tokens.json');
    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const tokens = JSON.parse(fileContent);

    console.log(chalk.green('✓ Successfully loaded sample tokens'));

    // Transform to mimic Figma API response structure
    const figmaResponse = {
      name: 'Design System Tokens',
      lastModified: new Date().toISOString(),
      version: '1.0.0',
      styles: transformToFigmaStyles(tokens)
    };

    return figmaResponse;
  } catch (error) {
    console.error(chalk.red('✗ Error loading mock Figma data:'), error.message);
    throw error;
  }
}

/**
 * Transform our token structure to mimic Figma's API response format
 * Figma returns styles with RGB values (0-1 range) and specific metadata
 * @param {Object} tokens - Our standardized token structure
 * @returns {Object} - Figma-style response
 */
function transformToFigmaStyles(tokens) {
  const styles = {
    colors: [],
    text: [],
    effects: []
  };

  // Transform colors
  if (tokens.colors) {
    styles.colors = extractColors(tokens.colors);
  }

  // Transform typography
  if (tokens.typography) {
    styles.text = extractTypography(tokens.typography);
  }

  // Transform shadows/effects
  if (tokens.shadows) {
    styles.effects = extractEffects(tokens.shadows);
  }

  return styles;
}

/**
 * Extract colors and convert hex to Figma RGB format (0-1 range)
 * @param {Object} colorTokens - Color tokens from our structure
 * @returns {Array} - Figma-style color objects
 */
function extractColors(colorTokens, prefix = '') {
  const colors = [];

  for (const [key, value] of Object.entries(colorTokens)) {
    const name = prefix ? `${prefix}/${key}` : key;

    if (value.type === 'color' && value.value) {
      // Convert hex to Figma RGB format
      const rgb = hexToRgb(value.value);
      colors.push({
        key: `color-${name.replace(/\//g, '-')}`,
        name: name,
        styleType: 'FILL',
        description: value.description || '',
        type: 'SOLID',
        color: rgb,
        value: value.value // Keep original hex for reference
      });
    } else if (typeof value === 'object' && !value.type) {
      // Nested structure, recurse
      colors.push(...extractColors(value, name));
    }
  }

  return colors;
}

/**
 * Extract typography tokens
 * @param {Object} typographyTokens - Typography tokens
 * @returns {Array} - Figma-style text objects
 */
function extractTypography(typographyTokens) {
  const textStyles = [];

  // Extract font families
  if (typographyTokens.fontFamily) {
    for (const [key, value] of Object.entries(typographyTokens.fontFamily)) {
      if (value.type === 'fontFamily') {
        textStyles.push({
          key: `font-family-${key}`,
          name: `fontFamily/${key}`,
          styleType: 'TEXT',
          fontFamily: value.value,
          description: value.description || ''
        });
      }
    }
  }

  // Extract font sizes
  if (typographyTokens.fontSize) {
    for (const [key, value] of Object.entries(typographyTokens.fontSize)) {
      if (value.type === 'dimension') {
        textStyles.push({
          key: `font-size-${key}`,
          name: `fontSize/${key}`,
          styleType: 'TEXT',
          fontSize: parseFloat(value.value),
          description: value.description || ''
        });
      }
    }
  }

  // Extract font weights
  if (typographyTokens.fontWeight) {
    for (const [key, value] of Object.entries(typographyTokens.fontWeight)) {
      if (value.type === 'fontWeight') {
        textStyles.push({
          key: `font-weight-${key}`,
          name: `fontWeight/${key}`,
          styleType: 'TEXT',
          fontWeight: parseInt(value.value),
          description: value.description || ''
        });
      }
    }
  }

  return textStyles;
}

/**
 * Extract shadow/effect tokens
 * @param {Object} shadowTokens - Shadow tokens
 * @returns {Array} - Figma-style effect objects
 */
function extractEffects(shadowTokens) {
  const effects = [];

  for (const [key, value] of Object.entries(shadowTokens)) {
    if (value.type === 'shadow') {
      effects.push({
        key: `shadow-${key}`,
        name: `shadow/${key}`,
        styleType: 'EFFECT',
        type: 'DROP_SHADOW',
        value: value.value,
        description: value.description || ''
      });
    }
  }

  return effects;
}

/**
 * Convert hex color to Figma RGB format (0-1 range)
 * @param {string} hex - Hex color value (e.g., "#FF0000")
 * @returns {Object} - RGB object with r, g, b values between 0-1
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return { r, g, b, a: 1 };
}

/**
 * Get token statistics from the mock API
 * @returns {Promise<Object>} - Statistics about available tokens
 */
export async function getTokenStats() {
  const data = await fetchFileStyles();
  const stats = data.styles;

  return {
    total: stats.colors.length + stats.text.length + stats.effects.length,
    colors: stats.colors.length,
    typography: stats.text.length,
    effects: stats.effects.length
  };
}
