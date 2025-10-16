import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './src/pipeline.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API endpoint to run the pipeline
app.post('/api/run-pipeline', async (req, res) => {
  try {
    console.log('📡 API: Starting pipeline execution...');

    // Run the pipeline
    await runPipeline({ method: 'mock' });

    console.log('✅ API: Pipeline completed successfully');

    res.json({
      success: true,
      message: 'Pipeline completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API: Pipeline failed:', error);
    res.status(500).json({
      success: false,
      message: 'Pipeline failed',
      error: error.message
    });
  }
});

// API endpoint to get extracted tokens
app.get('/api/tokens', async (req, res) => {
  try {
    const tokensPath = path.join(__dirname, 'output', 'extracted-tokens.json');
    const tokens = await fs.readFile(tokensPath, 'utf-8');
    res.json(JSON.parse(tokens));
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Tokens not found. Run the pipeline first.',
      error: error.message
    });
  }
});

// API endpoint to get output files
app.get('/api/output/:format/:filename', async (req, res) => {
  try {
    const { format, filename } = req.params;
    const filePath = path.join(__dirname, 'output', format, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    res.send(content);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'File not found',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the demo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'demo', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Demo available at http://localhost:${PORT}`);
  console.log(`🔧 API endpoints:`);
  console.log(`   POST /api/run-pipeline - Execute the pipeline`);
  console.log(`   GET  /api/tokens - Get extracted tokens`);
  console.log(`   GET  /api/output/:format/:filename - Get output files`);
});
