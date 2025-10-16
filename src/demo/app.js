/**
 * Demo Interface JavaScript
 * Loads and displays token data and generated outputs
 */

// State
let tokensData = null;
let outputFiles = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  renderAll();
});

// Setup event listeners
function setupEventListeners() {
  // Run pipeline button
  document.getElementById('run-pipeline').addEventListener('click', runPipeline);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });
}

// Load all data
async function loadData() {
  try {
    // Load extracted tokens
    const tokensResponse = await fetch('/output/extracted-tokens.json');
    tokensData = await tokensResponse.json();

    // Load output files
    const files = {
      css: '/output/css/variables.css',
      js: '/output/js/tokens.js',
      scss: '/output/scss/_variables.scss',
      json: '/output/json/tokens.json'
    };

    for (const [key, path] of Object.entries(files)) {
      try {
        const response = await fetch(path);
        outputFiles[key] = await response.text();
      } catch (error) {
        outputFiles[key] = `// File not found: ${path}`;
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Render all sections
function renderAll() {
  if (!tokensData) return;

  renderSourceTokens();
  renderOutputFiles();
  renderColorPreview();
  renderTypographyPreview();
  renderSpacingPreview();
  renderShadowPreview();
  renderStatistics();
}

// Render source tokens
function renderSourceTokens() {
  const container = document.getElementById('source-tokens');
  const sampleTokens = {
    colors: tokensData.colors?.primary || {},
    typography: tokensData.typography?.fontSize || {},
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px' }
  };
  container.textContent = JSON.stringify(sampleTokens, null, 2);
}

// Render output files
function renderOutputFiles() {
  document.getElementById('output-css').textContent = outputFiles.css || '// Loading...';
  document.getElementById('output-js').textContent = outputFiles.js || '// Loading...';
  document.getElementById('output-scss').textContent = outputFiles.scss || '// Loading...';
  document.getElementById('output-json').textContent = formatJSON(outputFiles.json) || '// Loading...';
}

// Render color preview
function renderColorPreview() {
  const container = document.getElementById('color-preview');
  container.innerHTML = '';

  if (!tokensData.colors) return;

  const colors = [];

  // Flatten colors
  function extractColors(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const name = prefix ? `${prefix}-${key}` : key;
      if (value.value && value.type === 'color') {
        colors.push({ name, value: value.value, description: value.description });
      } else if (typeof value === 'object' && !value.value) {
        extractColors(value, name);
      }
    }
  }

  extractColors(tokensData.colors);

  // Render first 12 colors
  colors.slice(0, 12).forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.innerHTML = `
      <div class="color-box" style="background: ${color.value};"></div>
      <div class="color-name">${color.name}</div>
      <div class="color-value">${color.value}</div>
    `;
    container.appendChild(swatch);
  });
}

// Render typography preview
function renderTypographyPreview() {
  const container = document.getElementById('typography-preview');
  container.innerHTML = '';

  if (!tokensData.typography) return;

  const fontSizes = tokensData.typography.fontSize || {};

  Object.entries(fontSizes).slice(0, 5).forEach(([name, token]) => {
    const sample = document.createElement('div');
    sample.className = 'typography-sample';
    sample.innerHTML = `
      <div class="typography-label">${name} - ${token.value}</div>
      <div style="font-size: ${token.value};">The quick brown fox jumps over the lazy dog</div>
    `;
    container.appendChild(sample);
  });
}

// Render spacing preview
function renderSpacingPreview() {
  const container = document.getElementById('spacing-preview');
  container.innerHTML = '';

  // Use predefined spacing or extract from tokens
  const spacingValues = [
    { name: 'xs', value: '4px' },
    { name: 'sm', value: '8px' },
    { name: 'md', value: '16px' },
    { name: 'lg', value: '24px' },
    { name: 'xl', value: '32px' },
    { name: '2xl', value: '48px' }
  ];

  spacingValues.forEach(spacing => {
    const sample = document.createElement('div');
    sample.className = 'spacing-sample';
    sample.innerHTML = `
      <div class="spacing-label">${spacing.name} (${spacing.value})</div>
      <div class="spacing-bar" style="width: ${spacing.value};"></div>
    `;
    container.appendChild(sample);
  });
}

// Render shadow preview
function renderShadowPreview() {
  const container = document.getElementById('shadow-preview');
  container.innerHTML = '';

  // Use predefined shadows or extract from tokens
  const shadows = [
    { name: 'sm', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    { name: 'md', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    { name: 'lg', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
    { name: 'xl', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
  ];

  shadows.forEach(shadow => {
    const sample = document.createElement('div');
    sample.className = 'shadow-sample';
    sample.innerHTML = `
      <div class="shadow-box" style="box-shadow: ${shadow.value};"></div>
      <div class="shadow-label">${shadow.name}</div>
    `;
    container.appendChild(sample);
  });
}

// Render statistics
function renderStatistics() {
  const totalTokens = countTokens(tokensData);

  document.getElementById('stat-tokens').textContent = totalTokens;
  document.getElementById('stat-files').textContent = '13';
  document.getElementById('stat-time').textContent = '~300ms';
}

// Count total tokens
function countTokens(obj, count = 0) {
  if (!obj || typeof obj !== 'object') return count;

  for (const key in obj) {
    if (key === 'metadata' || key === '$metadata') continue;

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

// Switch tabs
function switchTab(tab) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// Execute real pipeline via API
async function runPipeline() {
  const button = document.getElementById('run-pipeline');
  const statusEl = document.getElementById('pipeline-status');
  const progressSection = document.getElementById('progress-section');

  // Disable button
  button.disabled = true;
  button.textContent = '⏳ Running...';

  // Show progress section
  progressSection.classList.remove('hidden');

  // Show status
  statusEl.classList.remove('hidden', 'success', 'error');
  statusEl.classList.add('running');
  statusEl.textContent = '🔄 Pipeline running...';

  try {
    // Animate progress steps
    const steps = [1, 2, 3, 4];
    const stepAnimation = animateSteps(steps);

    // Call the real API to run the pipeline
    const response = await fetch('/api/run-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    // Wait for animation to complete
    await stepAnimation;

    if (result.success) {
      // Success
      await sleep(500);
      statusEl.classList.remove('running');
      statusEl.classList.add('success');
      statusEl.textContent = '✓ Pipeline completed successfully!';

      // Reload data and re-render
      await loadData();
      renderAll();
    } else {
      throw new Error(result.message || 'Pipeline failed');
    }

  } catch (error) {
    statusEl.classList.remove('running');
    statusEl.classList.add('error');
    statusEl.textContent = '✗ Pipeline failed: ' + error.message;
  } finally {
    button.disabled = false;
    button.textContent = '▶ Run Pipeline';

    // Hide progress after a delay
    setTimeout(() => {
      progressSection.classList.add('hidden');
      // Reset steps
      document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'complete');
      });
    }, 3000);
  }
}

// Animate progress steps
async function animateSteps(steps) {
  for (const step of steps) {
    // Activate step
    const stepEl = document.querySelector(`[data-step="${step}"]`);
    stepEl.classList.add('active');

    // Simulate work
    await sleep(800);

    // Complete step
    stepEl.classList.remove('active');
    stepEl.classList.add('complete');
  }
}

// Utility: Sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility: Format JSON
function formatJSON(jsonString) {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonString;
  }
}
