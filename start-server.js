#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting WanderLog backend and frontend...');

// Start backend
const backendPath = path.join(__dirname, 'server');
const backend = spawn('node', [path.join(backendPath, 'dist/index.js')], {
  cwd: backendPath,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.error('Backend exited with code:', code);
  process.exit(code || 1);
});

// Give backend time to start, then start frontend
setTimeout(() => {
  console.log('Starting frontend...');
  const frontend = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001'
    }
  });

  frontend.on('error', (err) => {
    console.error('Failed to start frontend:', err);
    process.exit(1);
  });

  frontend.on('exit', (code) => {
    console.error('Frontend exited with code:', code);
    process.exit(code || 1);
  });
}, 2000);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  backend.kill();
  process.exit(0);
});
