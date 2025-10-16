# Design Token Pipeline Demo

An automated pipeline for extracting, transforming, and generating design tokens from Figma to code.

## Overview

This project demonstrates an end-to-end automated workflow for managing design tokens. It extracts tokens from Figma (or mock data), normalizes them to a standard format, and generates platform-specific outputs using Style Dictionary.

## Features

- 🎨 **Token Extraction**: Extract design tokens from Figma API or mock data
- 🔄 **Normalization**: Convert to DTCG-compliant format with full metadata
- 🛠️ **Custom Transforms**: Semantic naming, categorization, and token aliasing
- 📦 **Multiple Outputs**: CSS, JavaScript, SCSS, JSON, Android, iOS, and documentation
- ⚡ **Automation**: Single command runs the entire pipeline (~300ms)
- 📊 **Visual Feedback**: Progress indicators, colored output, and detailed statistics

## Quick Start

```bash
# Install dependencies
npm install

# Run the complete pipeline
npm start
```

## Commands

```bash
npm run extract       # Extract tokens only
npm run transform     # Transform tokens only
npm run pipeline      # Run full pipeline
npm start            # Alias for pipeline
npm run test-transforms  # Test custom transforms
```

## What Gets Generated

The pipeline processes 42+ design tokens and generates 13 output files:

### CSS
- `output/css/variables.css` - CSS custom properties
- `output/css/tokens.css` - Custom transformed CSS

### JavaScript
- `output/js/tokens.js` - ES6 exports
- `output/js/tokens.module.js` - CommonJS module

### SCSS
- `output/scss/_variables.scss` - Sass variables

### JSON
- `output/json/tokens.json` - Nested JSON format
- `output/json/tokens-flat.json` - Flat JSON format

### Documentation
- `output/docs/tokens-documentation.json` - Full metadata and descriptions
- `output/docs/tokens-documentation.md` - Markdown tables
- `output/docs/tokens-documentation.html` - Interactive HTML preview

### Mobile
- `output/android/colors.xml` - Android color resources
- `output/android/dimens.xml` - Android dimension resources
- `output/ios/StyleDictionaryColor.swift` - iOS Swift class

## Project Structure

```
token-pipeline-demo/
├── src/
│   ├── extract/           # Token extraction
│   │   ├── mock-figma-api.js
│   │   ├── figma-api.js
│   │   ├── normalize.js
│   │   └── index.js
│   ├── transform/         # Custom transforms & formats
│   │   ├── custom-transforms.js
│   │   └── custom-formats.js
│   └── pipeline.js        # Main orchestration script
├── input/
│   └── sample-tokens.json # Sample token data
├── output/                # Generated files
└── style-dictionary.config.js
```

## Token Categories

- **Colors**: Primary palette, neutrals, semantic colors (23 tokens)
- **Typography**: Font families, sizes, weights, line heights (15 tokens)
- **Spacing**: Size scale from xs to 3xl (included in dimensions)
- **Shadows**: Shadow effects from sm to xl (4 tokens)
- **Border Radius**: Radius scale from none to full

## Using Real Figma API

1. Copy `.env.example` to `.env`
2. Add your Figma Personal Access Token
3. Add your Figma file key
4. Run: `npm run pipeline -- --figma --file=YOUR_FILE_KEY`

## Architecture

The pipeline follows a 6-step workflow:

1. **Extract** - Fetch tokens from Figma (mock or real API)
2. **Write** - Save normalized tokens to intermediate JSON
3. **Configure** - Load Style Dictionary configuration
4. **Build** - Generate all platform outputs
5. **Statistics** - Calculate token counts and categorization
6. **Verify** - Confirm all files were created

## Technologies

- **Style Dictionary** - Token transformation engine
- **Chalk** - Colored console output
- **Ora** - Loading spinners and progress indicators
- **Axios** - HTTP client for Figma API
- **Dotenv** - Environment configuration

## License

ISC
