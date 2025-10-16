/**
 * Custom Style Dictionary Transforms
 *
 * These transforms extend Style Dictionary's built-in transforms to handle
 * Figma-specific data and provide additional functionality for token processing.
 */

import StyleDictionary from 'style-dictionary';

/**
 * Register all custom transforms with Style Dictionary
 */
export function registerCustomTransforms() {

  // Custom transform: Semantic naming
  // Converts token paths to semantic, human-readable names
  StyleDictionary.registerTransform({
    name: 'name/semantic',
    type: 'name',
    transform: function(token, options) {
      // Convert path array to semantic name
      // e.g., ['colors', 'primary', '500'] -> 'color-primary-500'
      const parts = token.path.slice();

      // Add semantic prefixes based on token type
      const typePrefix = getTypePrefix(token.type);
      if (typePrefix && parts[0] !== typePrefix) {
        parts.unshift(typePrefix);
      }

      return parts
        .filter(part => part) // Remove empty parts
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-') // Replace special chars with dashes
        .replace(/-+/g, '-') // Replace multiple dashes with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
    }
  });

  // Custom transform: Category prefix
  // Adds category prefix to token names (e.g., 'color-', 'spacing-', 'typography-')
  StyleDictionary.registerTransform({
    name: 'name/category-prefix',
    type: 'name',
    transform: function(token, options) {
      const category = token.path[0];
      const name = token.path.slice(1).join('-');
      return `${category}-${name}`.toLowerCase();
    }
  });

  // Custom transform: Token categorization
  // Adds category metadata to tokens based on their type and path
  StyleDictionary.registerTransform({
    name: 'attribute/category',
    type: 'attribute',
    transform: function(token, options) {
      return {
        ...token.attributes,
        category: determineCategory(token),
        subcategory: determineSubcategory(token),
        state: determineState(token)
      };
    }
  });

  // Custom transform: CSS variable name with better formatting
  // Creates well-formatted CSS variable names
  StyleDictionary.registerTransform({
    name: 'name/css-custom',
    type: 'name',
    transform: function(token, options) {
      const prefix = options?.prefix || '';
      const parts = token.path.join('-').toLowerCase();
      return prefix ? `${prefix}-${parts}` : parts;
    }
  });

  // Custom transform: Figma metadata preservation
  // Preserves Figma-specific metadata in the token output
  StyleDictionary.registerTransform({
    name: 'attribute/figma',
    type: 'attribute',
    transform: function(token, options) {
      if (token.source?.figmaKey || token.source?.figmaName) {
        return {
          ...token.attributes,
          figma: {
            key: token.source.figmaKey,
            name: token.source.figmaName
          }
        };
      }
      return token.attributes;
    }
  });

  // Custom transform: Color with alpha channel
  // Handles colors with transparency
  StyleDictionary.registerTransform({
    name: 'color/css-rgba',
    type: 'value',
    filter: function(token) {
      return token.type === 'color' && token.alpha !== undefined;
    },
    transform: function(token, options) {
      const hex = token.value;
      const alpha = token.alpha || 1;

      // Convert hex to RGB
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  });

  // Custom transform: Pixel to REM conversion
  // Converts pixel values to rem units (assumes 16px base)
  StyleDictionary.registerTransform({
    name: 'size/px-to-rem',
    type: 'value',
    filter: function(token) {
      return (token.type === 'dimension' || token.type === 'fontSize') &&
             typeof token.value === 'string' &&
             token.value.includes('px');
    },
    transform: function(token, options) {
      const baseFontSize = options?.baseFontSize || 16;
      const pxValue = parseFloat(token.value);
      return `${(pxValue / baseFontSize).toFixed(3)}rem`;
    }
  });

  // Custom transform: Token reference resolver
  // Resolves references to other tokens (aliasing)
  StyleDictionary.registerTransform({
    name: 'value/reference',
    type: 'value',
    transitive: true,
    filter: function(token) {
      return typeof token.value === 'string' && token.value.startsWith('{') && token.value.endsWith('}');
    },
    transform: function(token, options) {
      // Extract reference path from {category.name.variant}
      const referencePath = token.value.slice(1, -1);

      // In a real implementation, this would resolve to the actual token value
      // For now, we'll return a CSS variable reference
      return `var(--${referencePath.replace(/\./g, '-')})`;
    }
  });

  // Custom transform: Comment with description
  // Adds token description as a comment in output
  StyleDictionary.registerTransform({
    name: 'attribute/comment',
    type: 'attribute',
    transform: function(token, options) {
      return {
        ...token.attributes,
        comment: token.description || token.comment
      };
    }
  });

  console.log('✓ Custom transforms registered');
}

/**
 * Helper: Get semantic type prefix based on token type
 */
function getTypePrefix(type) {
  const prefixMap = {
    'color': 'color',
    'dimension': 'size',
    'fontFamily': 'font',
    'fontSize': 'font-size',
    'fontWeight': 'font-weight',
    'lineHeight': 'line-height',
    'shadow': 'shadow',
    'number': 'number'
  };
  return prefixMap[type] || '';
}

/**
 * Helper: Determine token category
 */
function determineCategory(token) {
  const firstPath = token.path[0];

  if (firstPath === 'colors') return 'color';
  if (firstPath === 'spacing') return 'space';
  if (firstPath === 'typography') return 'typography';
  if (firstPath === 'effects' || firstPath === 'shadows') return 'effect';
  if (firstPath === 'borderRadius') return 'radius';

  return firstPath;
}

/**
 * Helper: Determine token subcategory
 */
function determineSubcategory(token) {
  if (token.path.length < 2) return undefined;
  return token.path[1];
}

/**
 * Helper: Determine token state (e.g., hover, active, disabled)
 */
function determineState(token) {
  const stateName = token.path[token.path.length - 1];
  const states = ['hover', 'active', 'focus', 'disabled', 'selected', 'pressed'];

  if (states.includes(stateName.toLowerCase())) {
    return stateName.toLowerCase();
  }

  return undefined;
}

/**
 * Create custom transform group for web platforms
 */
export function registerCustomTransformGroups() {
  // Custom transform group: Web (with semantic naming and REM units)
  StyleDictionary.registerTransformGroup({
    name: 'custom/web',
    transforms: [
      'name/semantic',
      'attribute/category',
      'size/px-to-rem'
    ]
  });

  // Custom transform group: CSS with custom naming
  StyleDictionary.registerTransformGroup({
    name: 'custom/css',
    transforms: [
      'name/css-custom',
      'attribute/category',
      'attribute/comment'
    ]
  });

  // Custom transform group: JavaScript with metadata
  StyleDictionary.registerTransformGroup({
    name: 'custom/js',
    transforms: [
      'name/camel',
      'attribute/category',
      'attribute/figma'
    ]
  });

  console.log('✓ Custom transform groups registered');
}

/**
 * Initialize all custom transforms and groups
 */
export function initializeCustomTransforms() {
  registerCustomTransforms();
  registerCustomTransformGroups();
}
