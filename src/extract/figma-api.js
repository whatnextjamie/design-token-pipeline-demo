import axios from 'axios';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

/**
 * Real Figma API Integration
 * Connects to Figma's REST API to extract design tokens from actual Figma files
 *
 * Setup:
 * 1. Get your Figma Personal Access Token from https://www.figma.com/developers/api#access-tokens
 * 2. Add to .env file: FIGMA_ACCESS_TOKEN=your_token_here
 * 3. Get your Figma file key from the URL: https://www.figma.com/file/{FILE_KEY}/...
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 250; // 250ms between requests (max 4 requests/second to be safe)
let lastRequestTime = 0;

/**
 * Apply rate limiting to prevent hitting Figma API limits
 * Figma allows 60 requests per minute (1 per second average)
 */
async function applyRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Create Figma API client with authentication
 * @returns {Object} - Axios instance configured for Figma API
 */
function createFigmaClient() {
  const token = process.env.FIGMA_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      'FIGMA_ACCESS_TOKEN not found in environment variables.\n' +
      'Please add your Figma Personal Access Token to the .env file.\n' +
      'Get your token from: https://www.figma.com/developers/api#access-tokens'
    );
  }

  return axios.create({
    baseURL: FIGMA_API_BASE,
    headers: {
      'X-Figma-Token': token
    },
    timeout: 10000
  });
}

/**
 * Fetch file metadata and styles from Figma
 * @param {string} fileKey - The Figma file key (from the file URL)
 * @returns {Promise<Object>} - Figma file data with styles
 */
export async function fetchFileStyles(fileKey) {
  if (!fileKey) {
    throw new Error('Figma file key is required');
  }

  const client = createFigmaClient();

  try {
    console.log(chalk.blue(`📥 Fetching file metadata from Figma API...`));
    console.log(chalk.gray(`   File Key: ${fileKey}`));

    // Apply rate limiting
    await applyRateLimit();

    // Fetch file metadata
    const fileResponse = await client.get(`/files/${fileKey}`);
    const fileData = fileResponse.data;

    console.log(chalk.green('✓ File metadata retrieved'));
    console.log(chalk.gray(`   File Name: ${fileData.name}`));
    console.log(chalk.gray(`   Last Modified: ${fileData.lastModified}`));

    // Fetch styles (colors, text styles, effects)
    console.log(chalk.blue('📥 Fetching styles from Figma API...'));

    await applyRateLimit();
    const stylesResponse = await client.get(`/files/${fileKey}/styles`);
    const stylesData = stylesResponse.data.meta.styles;

    console.log(chalk.green(`✓ Retrieved ${stylesData.length} style(s)`));

    // Fetch detailed information for each style
    const detailedStyles = await fetchStyleDetails(client, fileKey, stylesData);

    return {
      name: fileData.name,
      lastModified: fileData.lastModified,
      version: fileData.version,
      styles: detailedStyles
    };

  } catch (error) {
    handleFigmaApiError(error);
    throw error;
  }
}

/**
 * Fetch detailed information for each style
 * @param {Object} client - Axios client
 * @param {string} fileKey - Figma file key
 * @param {Array} styles - Array of style metadata
 * @returns {Promise<Object>} - Organized styles by type
 */
async function fetchStyleDetails(client, fileKey, styles) {
  console.log(chalk.blue('📥 Fetching detailed style information...'));

  const detailedStyles = {
    colors: [],
    text: [],
    effects: []
  };

  let processed = 0;

  for (const style of styles) {
    try {
      await applyRateLimit();

      // Get nodes that use this style
      const nodeResponse = await client.get(`/files/${fileKey}/nodes`, {
        params: { ids: style.node_id }
      });

      const node = nodeResponse.data.nodes[style.node_id];

      if (node && node.document) {
        const styleData = {
          key: style.key,
          name: style.name,
          description: style.description || '',
          styleType: style.style_type
        };

        // Extract style-specific data based on type
        if (style.style_type === 'FILL') {
          // Color style
          const fills = node.document.fills;
          if (fills && fills.length > 0 && fills[0].type === 'SOLID') {
            styleData.color = fills[0].color;
            styleData.type = 'SOLID';
            detailedStyles.colors.push(styleData);
          }
        } else if (style.style_type === 'TEXT') {
          // Text style
          const textStyle = node.document.style;
          if (textStyle) {
            styleData.fontFamily = textStyle.fontFamily;
            styleData.fontWeight = textStyle.fontWeight;
            styleData.fontSize = textStyle.fontSize;
            styleData.lineHeight = textStyle.lineHeightPx;
            styleData.letterSpacing = textStyle.letterSpacing;
            detailedStyles.text.push(styleData);
          }
        } else if (style.style_type === 'EFFECT') {
          // Effect style (shadows, blurs, etc.)
          const effects = node.document.effects;
          if (effects && effects.length > 0) {
            styleData.effects = effects;
            detailedStyles.effects.push(styleData);
          }
        }
      }

      processed++;
      if (processed % 5 === 0) {
        console.log(chalk.gray(`   Processed ${processed}/${styles.length} styles...`));
      }

    } catch (error) {
      console.warn(chalk.yellow(`⚠ Could not fetch details for style: ${style.name}`));
      console.warn(chalk.gray(`   Error: ${error.message}`));
    }
  }

  console.log(chalk.green(`✓ Processed ${processed} style(s)`));
  console.log(chalk.gray(`   Colors: ${detailedStyles.colors.length}`));
  console.log(chalk.gray(`   Text Styles: ${detailedStyles.text.length}`));
  console.log(chalk.gray(`   Effects: ${detailedStyles.effects.length}`));

  return detailedStyles;
}

/**
 * Fetch variables (new Figma Variables API for design tokens)
 * This is the newer approach for design tokens in Figma
 * @param {string} fileKey - The Figma file key
 * @returns {Promise<Object>} - Variable collections and values
 */
export async function fetchFileVariables(fileKey) {
  if (!fileKey) {
    throw new Error('Figma file key is required');
  }

  const client = createFigmaClient();

  try {
    console.log(chalk.blue('📥 Fetching variables from Figma API...'));

    await applyRateLimit();

    const response = await client.get(`/files/${fileKey}/variables/local`);
    const data = response.data.meta;

    console.log(chalk.green(`✓ Retrieved ${Object.keys(data.variables || {}).length} variable(s)`));

    return {
      variables: data.variables || {},
      variableCollections: data.variableCollections || {}
    };

  } catch (error) {
    // Variables API might not be available for all files
    if (error.response?.status === 404) {
      console.log(chalk.yellow('⚠ Variables not found (file may not use Figma Variables)'));
      return { variables: {}, variableCollections: {} };
    }
    handleFigmaApiError(error);
    throw error;
  }
}

/**
 * Fetch both styles and variables from a Figma file
 * @param {string} fileKey - The Figma file key
 * @returns {Promise<Object>} - Combined styles and variables
 */
export async function fetchFileTokens(fileKey) {
  console.log(chalk.blue('🎨 Starting Figma token extraction...'));
  console.log(chalk.gray('─'.repeat(50)));

  const [stylesData, variablesData] = await Promise.all([
    fetchFileStyles(fileKey),
    fetchFileVariables(fileKey).catch(() => ({ variables: {}, variableCollections: {} }))
  ]);

  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.green('✓ Figma extraction complete!'));

  return {
    ...stylesData,
    variables: variablesData.variables,
    variableCollections: variablesData.variableCollections
  };
}

/**
 * Handle Figma API errors with helpful messages
 * @param {Error} error - The error object
 */
function handleFigmaApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 400:
        console.error(chalk.red('✗ Bad Request - Invalid file key or parameters'));
        break;
      case 401:
        console.error(chalk.red('✗ Unauthorized - Invalid or missing Figma access token'));
        console.error(chalk.gray('  Check your FIGMA_ACCESS_TOKEN in .env'));
        break;
      case 403:
        console.error(chalk.red('✗ Forbidden - You don\'t have access to this file'));
        break;
      case 404:
        console.error(chalk.red('✗ Not Found - File or resource doesn\'t exist'));
        break;
      case 429:
        console.error(chalk.red('✗ Rate Limit Exceeded - Too many requests'));
        console.error(chalk.gray('  Please wait a moment and try again'));
        break;
      case 500:
        console.error(chalk.red('✗ Figma Server Error - Try again later'));
        break;
      default:
        console.error(chalk.red(`✗ Figma API Error (${status}): ${message}`));
    }
  } else if (error.code === 'ENOTFOUND') {
    console.error(chalk.red('✗ Network Error - Cannot reach Figma API'));
    console.error(chalk.gray('  Check your internet connection'));
  } else {
    console.error(chalk.red('✗ Error:'), error.message);
  }
}

/**
 * Validate Figma access token and connection
 * @returns {Promise<boolean>} - True if token is valid
 */
export async function validateToken() {
  try {
    const client = createFigmaClient();
    await client.get('/me');
    console.log(chalk.green('✓ Figma access token is valid'));
    return true;
  } catch (error) {
    console.error(chalk.red('✗ Figma access token validation failed'));
    handleFigmaApiError(error);
    return false;
  }
}
