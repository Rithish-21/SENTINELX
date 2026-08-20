import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pythonPath = 'C:\\Users\\Rithish A\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

console.log('===========================================================');
console.log('🛡️  STARTING SENTINELX CYBER DEFENSE PLATFORM (FULL STACK)  🛡️');
console.log('===========================================================');

// 1. Launch FastAPI Backend
console.log('🚀 [Backend] Launching FastAPI Graph Engine on http://127.0.0.1:8000...');
const backendProcess = spawn(
  pythonPath,
  ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'],
  {
    cwd: path.join(__dirname, 'backend'),
    shell: false,
    stdio: 'inherit',
  }
);

backendProcess.on('error', (err) => {
  console.error('❌ Failed to start Python backend:', err);
});

// 2. Launch Vite Frontend
console.log('⚡ [Frontend] Launching Vite Dashboard on http://localhost:5173...');
const frontendProcess = spawn('npm.cmd', ['run', 'dev', '--workspace=frontend'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit',
});

frontendProcess.on('error', (err) => {
  console.error('❌ Failed to start Vite frontend:', err);
});

const cleanup = () => {
  console.log('\n🛑 Shutting down SentinelX processes...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
