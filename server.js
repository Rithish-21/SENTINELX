import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

// Static Frontend Serving & SPA Fallback (Production)
const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist));

app.use((req, res) => {
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('SentinelX Defense Engine API Online. Frontend compiling...');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️ SentinelX Production Server listening on http://0.0.0.0:${PORT}`);
});
