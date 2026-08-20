import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// In cloud/production environments (like Render), start the production server directly
if (process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.PORT) {
  console.log('🚀 [Production] Launching SentinelX Unified Server (Render/Cloud)...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  serverProcess.on('exit', (code) => process.exit(code || 0));
} else {
  // Local Development
  console.log('===========================================================');
  console.log('🛡️  STARTING SENTINELX CYBER DEFENSE PLATFORM (DEV)  🛡️');
  console.log('===========================================================');

  // Check if python exists
  const winPython = 'C:\\Users\\Rithish A\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  const hasWinPython = isWindows && fs.existsSync(winPython);
  const pythonBin = hasWinPython ? winPython : (isWindows ? 'python' : 'python3');

  console.log('🚀 [Backend] Launching Defense Engine on http://127.0.0.1:8000...');
  const backendProcess = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'],
    {
      cwd: path.join(__dirname, 'backend'),
      shell: false,
      stdio: 'inherit',
    }
  );

  backendProcess.on('error', () => {
    console.log('⚠️ Python not available, falling back to unified Node defense server...');
    spawn('node', ['server.js'], { cwd: __dirname, stdio: 'inherit' });
  });

  console.log('⚡ [Frontend] Launching Vite Dashboard on http://localhost:5173...');
  const frontendProcess = spawn(npmCmd, ['run', 'dev', '--workspace=frontend'], {
    cwd: __dirname,
    shell: isWindows,
    stdio: 'inherit',
  });

  frontendProcess.on('error', (err) => {
    console.error('❌ Failed to start Vite frontend:', err);
  });

  const cleanup = () => {
    console.log('\n🛑 Shutting down processes...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
