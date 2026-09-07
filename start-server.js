#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

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

// Give backend time to start, then start frontend
setTimeout(() => {
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
}, 1000);

process.on('SIGTERM', () => {
  backend.kill();
  process.exit(0);
});
