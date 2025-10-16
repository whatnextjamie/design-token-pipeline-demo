/**
 * Style Dictionary Configuration
 * Transforms design tokens into multiple platform-specific formats
 *
 * This config defines:
 * - Source files (where tokens come from)
 * - Platforms (CSS, JS, SCSS outputs)
 * - Transform groups (how to convert tokens for each platform)
 * - Output files and formats
 * - Custom transforms for Figma-specific data
 */

import { initializeCustomTransforms } from './src/transform/custom-transforms.js';
import { initializeCustomFormats } from './src/transform/custom-formats.js';

// Initialize custom transforms and formats before building
initializeCustomTransforms();
initializeCustomFormats();

export default {
  // Source token files
  source: ['output/extracted-tokens.json'],

  // Platform-specific configurations
  platforms: {
    // CSS Custom Properties (CSS Variables)
    css: {
      transformGroup: 'css',
      buildPath: 'output/css/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          options: {
            // Output references to other tokens when possible
            // e.g., if primary-button uses primary-500, output: var(--color-primary-500)
            outputReferences: true,
            // Selector for CSS variables
            selector: ':root'
          }
        }
      ]
    },

    // CSS with custom transforms (semantic naming + REM units)
    'css-custom': {
      transformGroup: 'custom/css',
      buildPath: 'output/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: ':root',
            prefix: 'token'
          }
        }
      ]
    },

    // JavaScript/ES6 (for React, Vue, etc.)
    js: {
      transformGroup: 'js',
      buildPath: 'output/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
          options: {
            outputReferences: false
          }
        },
        {
          destination: 'tokens.module.js',
          format: 'javascript/module',
          options: {
            outputReferences: false
          }
        }
      ]
    },

    // SCSS Variables (for Sass/SCSS projects)
    scss: {
      transformGroup: 'scss',
      buildPath: 'output/scss/',
      files: [
        {
          destination: '_variables.scss',
          format: 'scss/variables',
          options: {
            outputReferences: true
          }
        }
      ]
    },

    // JSON (for documentation or other tools)
    json: {
      transformGroup: 'js',
      buildPath: 'output/json/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested'
        },
        {
          destination: 'tokens-flat.json',
          format: 'json/flat'
        }
      ]
    },

    // Documentation (human-readable formats)
    docs: {
      transformGroup: 'js',
      buildPath: 'output/docs/',
      files: [
        {
          destination: 'tokens-documentation.json',
          format: 'json/documentation'
        },
        {
          destination: 'tokens-documentation.md',
          format: 'markdown/documentation',
          options: {
            title: 'Design Tokens Documentation'
          }
        },
        {
          destination: 'tokens-documentation.html',
          format: 'html/documentation',
          options: {
            title: 'Design Tokens Documentation'
          }
        }
      ]
    },

    // Android (XML) - for mobile apps
    android: {
      transformGroup: 'android',
      buildPath: 'output/android/',
      files: [
        {
          destination: 'colors.xml',
          format: 'android/colors',
          filter: {
            type: 'color'
          }
        },
        {
          destination: 'dimens.xml',
          format: 'android/dimens',
          filter: {
            type: 'dimension'
          }
        }
      ]
    },

    // iOS (Swift) - for mobile apps
    ios: {
      transformGroup: 'ios',
      buildPath: 'output/ios/',
      files: [
        {
          destination: 'StyleDictionaryColor.swift',
          format: 'ios-swift/class.swift',
          className: 'StyleDictionaryColor',
          filter: {
            type: 'color'
          }
        }
      ]
    }
  }
};
