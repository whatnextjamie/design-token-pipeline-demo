import chalk from 'chalk';

/**
 * Token Normalization Module
 * Converts Figma-style tokens to standardized DTCG (Design Token Community Group) format
 * Handles conversions like RGB (0-1) to hex, naming standardization, and metadata enrichment
 */

/**
 * Normalize all tokens from Figma format to standard format
 * @param {Object} figmaData - Raw data from Figma API (or mock)
 * @returns {Object} - Normalized tokens in DTCG format
 */
export function normalizeTokens(figmaData) {
  console.log(chalk.blue('🔄 Normalizing tokens...'));

  const normalized = {
    colors: {},
    typography: {
      fontFamily: {},
      fontSize: {},
      fontWeight: {},
      lineHeight: {}
    },
    effects: {},
    metadata: {
      source: 'figma',
      extractedAt: new Date().toISOString(),
      fileName: figmaData.name,
      version: figmaData.version
    }
  };

  // Normalize colors
  if (figmaData.styles?.colors) {
    normalized.colors = normalizeColors(figmaData.styles.colors);
    console.log(chalk.green(`✓ Normalized ${Object.keys(normalized.colors).length} color token(s)`));
  }

  // Normalize typography
  if (figmaData.styles?.text) {
    const typography = normalizeTypography(figmaData.styles.text);
    normalized.typography = { ...normalized.typography, ...typography };
    const totalTypography = Object.values(typography).reduce((sum, category) => sum + Object.keys(category).length, 0);
    console.log(chalk.green(`✓ Normalized ${totalTypography} typography token(s)`));
  }

  // Normalize effects (shadows, etc.)
  if (figmaData.styles?.effects) {
    normalized.effects = normalizeEffects(figmaData.styles.effects);
    console.log(chalk.green(`✓ Normalized ${Object.keys(normalized.effects).length} effect token(s)`));
  }

  return normalized;
}

/**
 * Normalize color tokens
 * Convert Figma RGB (0-1) to hex and organize by naming convention
 * @param {Array} colors - Figma color styles
 * @returns {Object} - Normalized color tokens
 */
export function normalizeColors(colors) {
  const normalized = {};

  for (const color of colors) {
    // Parse the Figma style name (e.g., "primary/500" or "neutral/white")
    const namePath = parseFigmaName(color.name);

    // Convert Figma RGB to hex
    let hexValue;
    if (color.color) {
      hexValue = rgbToHex(color.color.r * 255, color.color.g * 255, color.color.b * 255);
    } else if (color.value) {
      // Already in hex format (from mock API)
      hexValue = color.value;
    }

    // Create nested structure based on name path
    setNestedValue(normalized, namePath, {
      value: hexValue,
      type: 'color',
      description: color.description || `Color: ${color.name}`,
      source: {
        figmaKey: color.key,
        figmaName: color.name
      }
    });
  }

  return normalized;
}

/**
 * Normalize typography tokens
 * @param {Array} textStyles - Figma text styles
 * @returns {Object} - Normalized typography tokens
 */
export function normalizeTypography(textStyles) {
  const normalized = {
    fontFamily: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {}
  };

  for (const style of textStyles) {
    const namePath = parseFigmaName(style.name);
    const category = namePath[0]; // e.g., "fontFamily", "fontSize", etc.
    const tokenName = namePath.slice(1).join('-') || namePath[0];

    // Organize by typography property
    if (style.fontFamily) {
      setNestedValue(normalized.fontFamily, [tokenName], {
        value: style.fontFamily,
        type: 'fontFamily',
        description: style.description || `Font family: ${style.fontFamily}`,
        source: {
          figmaKey: style.key,
          figmaName: style.name
        }
      });
    }

    if (style.fontSize) {
      setNestedValue(normalized.fontSize, [tokenName], {
        value: `${style.fontSize}px`,
        type: 'dimension',
        description: style.description || `Font size: ${style.fontSize}px`,
        source: {
          figmaKey: style.key,
          figmaName: style.name
        }
      });
    }

    if (style.fontWeight) {
      setNestedValue(normalized.fontWeight, [tokenName], {
        value: String(style.fontWeight),
        type: 'fontWeight',
        description: style.description || `Font weight: ${style.fontWeight}`,
        source: {
          figmaKey: style.key,
          figmaName: style.name
        }
      });
    }

    if (style.lineHeight) {
      // Convert to unitless ratio if possible
      const lineHeightValue = style.fontSize
        ? (style.lineHeight / style.fontSize).toFixed(2)
        : style.lineHeight;

      setNestedValue(normalized.lineHeight, [tokenName], {
        value: String(lineHeightValue),
        type: 'number',
        description: style.description || `Line height: ${lineHeightValue}`,
        source: {
          figmaKey: style.key,
          figmaName: style.name
        }
      });
    }
  }

  return normalized;
}

/**
 * Normalize effect tokens (shadows, blurs, etc.)
 * @param {Array} effects - Figma effect styles
 * @returns {Object} - Normalized effect tokens
 */
export function normalizeEffects(effects) {
  const normalized = {};

  for (const effect of effects) {
    const namePath = parseFigmaName(effect.name);

    let value;
    if (effect.effects && effect.effects.length > 0) {
      // Convert Figma effect format to CSS shadow format
      value = figmaEffectToCss(effect.effects);
    } else if (effect.value) {
      // Already in CSS format (from mock API)
      value = effect.value;
    }

    setNestedValue(normalized, namePath, {
      value: value,
      type: 'shadow',
      description: effect.description || `Effect: ${effect.name}`,
      source: {
        figmaKey: effect.key,
        figmaName: effect.name
      }
    });
  }

  return normalized;
}

/**
 * Convert Figma RGB values to hex color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} - Hex color (e.g., "#FF0000")
 */
export function rgbToHex(r, g, b) {
  const toHex = (value) => {
    const hex = Math.round(value).toString(16).padStart(2, '0');
    return hex.toUpperCase();
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse Figma style name into path array
 * Converts "primary/500" to ["primary", "500"]
 * Converts "fontFamily/base" to ["fontFamily", "base"]
 * @param {string} name - Figma style name
 * @returns {Array} - Path array
 */
function parseFigmaName(name) {
  // Split by forward slash
  return name.split('/').map(part =>
    // Convert to camelCase and remove special characters
    part.trim()
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
  ).filter(Boolean);
}

/**
 * Set a value in a nested object using a path array
 * @param {Object} obj - Target object
 * @param {Array} path - Path array
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = value;
}

/**
 * Convert Figma effect format to CSS shadow format
 * @param {Array} effects - Figma effects array
 * @returns {string} - CSS shadow value
 */
function figmaEffectToCss(effects) {
  const shadows = [];

  for (const effect of effects) {
    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      const { offset, radius, color } = effect;
      const x = offset?.x || 0;
      const y = offset?.y || 0;
      const blur = radius || 0;
      const spread = effect.spread || 0;

      // Convert RGBA color
      const r = Math.round((color?.r || 0) * 255);
      const g = Math.round((color?.g || 0) * 255);
      const b = Math.round((color?.b || 0) * 255);
      const a = color?.a !== undefined ? color.a : 1;

      const colorString = `rgba(${r}, ${g}, ${b}, ${a})`;
      const prefix = effect.type === 'INNER_SHADOW' ? 'inset ' : '';

      shadows.push(`${prefix}${x}px ${y}px ${blur}px ${spread}px ${colorString}`);
    }
  }

  return shadows.join(', ');
}

/**
 * Standardize token naming convention
 * Converts various naming formats to kebab-case
 * @param {string} name - Original token name
 * @returns {string} - Standardized name
 */
export function standardizeTokenName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .replace(/[\s_]+/g, '-') // spaces and underscores to dashes
    .toLowerCase()
    .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
}

/**
 * Add metadata to tokens
 * @param {Object} tokens - Token object
 * @param {Object} metadata - Metadata to add
 * @returns {Object} - Tokens with metadata
 */
export function addMetadata(tokens, metadata) {
  return {
    ...tokens,
    $metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      ...metadata
    }
  };
}
