/**
 * Custom Style Dictionary Formats
 *
 * These custom formats create human-readable documentation
 * and specialized output formats for design tokens.
 */

import StyleDictionary from 'style-dictionary';

/**
 * Register all custom formats with Style Dictionary
 */
export function registerCustomFormats() {

  // Custom format: JSON Documentation
  // Creates a human-readable JSON file with full token metadata
  StyleDictionary.registerFormat({
    name: 'json/documentation',
    format: function({ dictionary, options }) {
      const tokens = {
        $schema: 'https://example.com/schemas/design-tokens/v1',
        $metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'Style Dictionary',
          tokenCount: dictionary.allTokens.length,
          version: '1.0.0',
          description: 'Design token documentation with full metadata'
        },
        tokens: {}
      };

      // Group tokens by category
      const categories = {};

      dictionary.allTokens.forEach(token => {
        const category = token.path[0] || 'other';

        if (!categories[category]) {
          categories[category] = {
            description: getCategoryDescription(category),
            tokens: []
          };
        }

        categories[category].tokens.push({
          name: token.name,
          value: token.value,
          type: token.type || 'unknown',
          path: token.path.join('.'),
          description: token.description || token.comment || '',
          category: token.attributes?.category || category,
          subcategory: token.attributes?.subcategory,
          figma: token.source || token.attributes?.figma,
          original: {
            value: token.original?.value,
            type: token.original?.type
          }
        });
      });

      tokens.tokens = categories;

      return JSON.stringify(tokens, null, 2);
    }
  });

  // Custom format: Markdown Documentation
  // Creates a markdown table for documentation sites
  StyleDictionary.registerFormat({
    name: 'markdown/documentation',
    format: function({ dictionary, options }) {
      const title = options?.title || 'Design Tokens';
      let output = `# ${title}\n\n`;
      output += `Generated on ${new Date().toISOString()}\n\n`;
      output += `Total tokens: ${dictionary.allTokens.length}\n\n`;

      // Group by category
      const categories = {};
      dictionary.allTokens.forEach(token => {
        const category = token.path[0] || 'other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(token);
      });

      // Generate markdown for each category
      Object.entries(categories).forEach(([category, tokens]) => {
        output += `## ${capitalize(category)}\n\n`;
        output += `| Name | Value | Type | Description |\n`;
        output += `|------|-------|------|-------------|\n`;

        tokens.forEach(token => {
          const name = token.name;
          const value = formatValue(token.value, token.type);
          const type = token.type || 'unknown';
          const description = token.description || token.comment || '-';

          output += `| \`${name}\` | ${value} | ${type} | ${description} |\n`;
        });

        output += '\n';
      });

      return output;
    }
  });

  // Custom format: HTML Documentation
  // Creates an HTML page showing all tokens with previews
  StyleDictionary.registerFormat({
    name: 'html/documentation',
    format: function({ dictionary, options }) {
      const title = options?.title || 'Design Tokens';

      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { margin-bottom: 0.5rem; color: #333; }
    .meta { color: #666; margin-bottom: 2rem; }
    .category {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .category h2 {
      margin-bottom: 1rem;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }
    .token {
      display: grid;
      grid-template-columns: 200px 1fr 150px 100px;
      gap: 1rem;
      padding: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
    }
    .token:last-child { border-bottom: none; }
    .token-name {
      font-family: 'Monaco', monospace;
      font-size: 0.9rem;
      color: #0066cc;
    }
    .token-value {
      font-family: 'Monaco', monospace;
      font-size: 0.85rem;
      color: #333;
    }
    .token-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .color-swatch {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .size-preview {
      height: 8px;
      background: #0066cc;
      border-radius: 2px;
    }
    .token-type {
      font-size: 0.8rem;
      color: #666;
      background: #f0f0f0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      text-align: center;
    }
    .token-description {
      grid-column: 1 / -1;
      font-size: 0.85rem;
      color: #666;
      padding-left: 0.5rem;
      border-left: 2px solid #e0e0e0;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="meta">Generated on ${new Date().toLocaleString()}</div>
`;

      // Group by category
      const categories = {};
      dictionary.allTokens.forEach(token => {
        const category = token.path[0] || 'other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(token);
      });

      // Generate HTML for each category
      Object.entries(categories).forEach(([category, tokens]) => {
        html += `    <div class="category">
      <h2>${capitalize(category)}</h2>
`;

        tokens.forEach(token => {
          const preview = generatePreview(token);
          html += `      <div class="token">
        <div class="token-name">${token.name}</div>
        <div class="token-value">${escapeHtml(token.value)}</div>
        <div class="token-preview">${preview}</div>
        <div class="token-type">${token.type || 'unknown'}</div>
`;
          if (token.description || token.comment) {
            html += `        <div class="token-description">${escapeHtml(token.description || token.comment)}</div>
`;
          }
          html += `      </div>
`;
        });

        html += `    </div>
`;
      });

      html += `  </div>
</body>
</html>`;

      return html;
    }
  });

  console.log('✓ Custom formats registered');
}

/**
 * Helper: Get category description
 */
function getCategoryDescription(category) {
  const descriptions = {
    colors: 'Color tokens for brand colors, neutrals, and semantic colors',
    typography: 'Typography tokens including font families, sizes, and weights',
    spacing: 'Spacing tokens for margins, padding, and layout',
    effects: 'Effect tokens for shadows, blurs, and other visual effects',
    shadows: 'Shadow effect tokens',
    borderRadius: 'Border radius tokens for rounded corners'
  };
  return descriptions[category] || `${category} tokens`;
}

/**
 * Helper: Capitalize string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Format value for display
 */
function formatValue(value, type) {
  if (type === 'color') {
    return `<span style="display:inline-block;width:20px;height:20px;background:${value};border:1px solid #ddd;vertical-align:middle;margin-right:8px;"></span>\`${value}\``;
  }
  return `\`${value}\``;
}

/**
 * Helper: Generate HTML preview for token
 */
function generatePreview(token) {
  if (token.type === 'color') {
    return `<div class="color-swatch" style="background: ${token.value};"></div>`;
  }
  if (token.type === 'dimension' || token.type === 'fontSize') {
    const width = Math.min(parseFloat(token.value) * 2, 100);
    return `<div class="size-preview" style="width: ${width}px;"></div>`;
  }
  return '';
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize all custom formats
 */
export function initializeCustomFormats() {
  registerCustomFormats();
}
