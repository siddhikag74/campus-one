#!/usr/bin/env node

/**
 * CampusOne — Self-Healing Public Access & Tunnel Supervisor
 * 
 * Features:
 * - Automatically starts and monitors Express Backend (port 5050)
 * - Automatically starts and monitors Vite Frontend (port 5173)
 * - Automatically starts and monitors Cloudflare Quick Tunnel (cloudflared)
 * - Auto-detects the live trycloudflare.com URL and writes it to PUBLIC_URL.txt
 * - Periodic health watchdog (pings local services and public HTTPS endpoint)
 * - Self-healing recovery: restarts cloudflared on edge drop, 1033 errors, or network reconnection
 * - Anti-flapping exponential backoff to protect against infinite restart loops
 * - Clean SIGINT/SIGTERM termination of all child processes
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const BIN_CLOUDFLARED = path.join(ROOT_DIR, 'bin', 'cloudflared');
const PUBLIC_URL_FILE = path.join(ROOT_DIR, 'PUBLIC_URL.txt');
const LOG_FILE = path.join(ROOT_DIR, 'tunnel-supervisor.log');

const CONFIG = {
  backendPort: 5050,
  frontendPort: 5173,
  healthCheckIntervalMs: 15000,   // 15 seconds
  requestTimeoutMs: 8000,         // 8 seconds
  maxConsecutiveFailures: 2,      // Restart tunnel after 2 failed health checks
  backoffBaseMs: 3000,
  backoffMaxMs: 30000,
};

let currentPublicUrl = null;
let cloudflaredProc = null;
let backendProc = null;
let frontendProc = null;
let consecutiveFailures = 0;
let isRestartingTunnel = false;
let backoffMs = CONFIG.backoffBaseMs;
let isShuttingDown = false;

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level}] ${message}`;
  console.log(formatted);
  try {
    fs.appendFileSync(LOG_FILE, formatted + '\n');
  } catch (e) {
    // Ignore logging errors
  }
}

function printBanner(url) {
  const line = '═'.repeat(64);
  console.log('\n' + line);
  console.log('  🎓 CAMPUSONE — SELF-HEALING PUBLIC ACCESS IS ACTIVE');
  console.log(line);
  console.log(`  🌐 Public HTTPS URL : \x1b[36m\x1b[1m${url}\x1b[0m`);
  console.log(`  💻 Local Frontend    : http://localhost:${CONFIG.frontendPort}`);
  console.log(`  📡 Local Backend API : http://localhost:${CONFIG.backendPort}/api`);
  console.log(`  🩺 Health Endpoint   : ${url}/api/health`);
  console.log(`  📄 URL Saved File    : PUBLIC_URL.txt`);
  console.log(`  🛡️  Auto-Recovery     : Enabled (Watchdog: every ${CONFIG.healthCheckIntervalMs / 1000}s)`);
  console.log(line + '\n');
}

// Simple HTTP/HTTPS fetch helper with strict timeout
function fetchWithTimeout(url, timeoutMs = CONFIG.requestTimeoutMs) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const req = client.get(url, {
      rejectUnauthorized: false,
      headers: { 'User-Agent': 'CampusOne-Watchdog/1.0' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Check if a local port is actively responding
async function isPortResponding(port, pathName = '/') {
  try {
    const res = await fetchWithTimeout(`http://127.0.0.1:${port}${pathName}`, 3000);
    return res.statusCode >= 200 && res.statusCode < 500;
  } catch (err) {
    return false;
  }
}

// Ensure Backend is running
async function ensureBackend() {
  const alive = await isPortResponding(CONFIG.backendPort, '/api/health');
  if (alive) {
    log(`Backend already running on port ${CONFIG.backendPort}`);
    return;
  }

  log(`Starting Express Backend on port ${CONFIG.backendPort}...`);
  backendProc = spawn('npm', ['run', 'server'], {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  backendProc.stdout.on('data', (d) => {
    const str = d.toString().trim();
    if (str.includes('Server running') || str.includes('Connected to MongoDB')) {
      log(`[Backend] ${str}`);
    }
  });

  backendProc.stderr.on('data', (d) => {
    log(`[Backend Error] ${d.toString().trim()}`, 'WARN');
  });

  // Wait for backend to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isPortResponding(CONFIG.backendPort, '/api/health')) {
      log('Backend is online and database is connected.');
      return;
    }
  }
  throw new Error('Backend failed to start within 30 seconds.');
}

// Ensure Frontend is running
async function ensureFrontend() {
  const alive = await isPortResponding(CONFIG.frontendPort, '/');
  if (alive) {
    log(`Frontend already running on port ${CONFIG.frontendPort}`);
    return;
  }

  log(`Starting Vite Frontend on port ${CONFIG.frontendPort}...`);
  frontendProc = spawn('npm', ['run', 'client'], {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  frontendProc.stdout.on('data', (d) => {
    const str = d.toString().trim();
    if (str.includes('Local:') || str.includes('Network:')) {
      log(`[Frontend] ${str}`);
    }
  });

  frontendProc.stderr.on('data', (d) => {
    log(`[Frontend Msg] ${d.toString().trim()}`, 'INFO');
  });

  // Wait for frontend to be ready
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isPortResponding(CONFIG.frontendPort, '/')) {
      log('Frontend Vite server is online.');
      return;
    }
  }
  throw new Error('Frontend failed to start within 20 seconds.');
}

// Start Cloudflared Tunnel
function startTunnel() {
  return new Promise((resolve, reject) => {
    log('Spawning fresh Cloudflare Quick Tunnel...');
    
    if (!fs.existsSync(BIN_CLOUDFLARED)) {
      return reject(new Error(`cloudflared binary not found at ${BIN_CLOUDFLARED}`));
    }

    // Ensure executable permission
    try {
      fs.chmodSync(BIN_CLOUDFLARED, 0o755);
    } catch (e) {}

    cloudflaredProc = spawn(BIN_CLOUDFLARED, ['tunnel', '--url', `http://127.0.0.1:${CONFIG.frontendPort}`, '--no-autoupdate'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let detectedUrl = null;
    let resolved = false;

    const parseOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !detectedUrl) {
        detectedUrl = match[0];
        currentPublicUrl = detectedUrl;
        
        try {
          fs.writeFileSync(PUBLIC_URL_FILE, detectedUrl + '\n');
        } catch (e) {
          log(`Failed to write to ${PUBLIC_URL_FILE}: ${e.message}`, 'WARN');
        }

        log(`Tunnel established: ${detectedUrl}`);
        printBanner(detectedUrl);

        if (!resolved) {
          resolved = true;
          resolve(detectedUrl);
        }
      }
    };

    cloudflaredProc.stdout.on('data', parseOutput);
    cloudflaredProc.stderr.on('data', parseOutput);

    cloudflaredProc.on('error', (err) => {
      log(`cloudflared process error: ${err.message}`, 'ERROR');
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    cloudflaredProc.on('exit', (code, signal) => {
      log(`cloudflared exited with code ${code}, signal ${signal}`, isShuttingDown ? 'INFO' : 'WARN');
      cloudflaredProc = null;
      if (!resolved) {
        resolved = true;
        reject(new Error(`cloudflared exited prematurely with code ${code}`));
      }
      if (!isShuttingDown && !isRestartingTunnel) {
        scheduleTunnelRestart('Process exit');
      }
    });

    // Timeout safety if URL not found within 25 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Timed out waiting for trycloudflare.com URL from cloudflared output.'));
      }
    }, 25000);
  });
}

// Graceful Tunnel Restart with backoff
async function restartTunnel(reason = 'Watchdog check failure') {
  if (isRestartingTunnel || isShuttingDown) return;
  isRestartingTunnel = true;

  log(`🔄 Self-Healing Triggered: Restarting tunnel. Reason: ${reason}`, 'WARN');

  if (cloudflaredProc) {
    try {
      cloudflaredProc.kill('SIGTERM');
      setTimeout(() => {
        if (cloudflaredProc) {
          try { cloudflaredProc.kill('SIGKILL'); } catch (e) {}
        }
      }, 3000);
    } catch (e) {}
  }

  log(`Waiting ${backoffMs / 1000}s backoff before reconnecting...`);
  await new Promise((r) => setTimeout(r, backoffMs));

  try {
    await startTunnel();
    consecutiveFailures = 0;
    backoffMs = CONFIG.backoffBaseMs; // Reset backoff on success
    log('✅ Tunnel self-healing recovery completed successfully.');
  } catch (err) {
    log(`Recovery attempt failed: ${err.message}`, 'ERROR');
    // Exponential backoff up to max
    backoffMs = Math.min(backoffMs * 1.5, CONFIG.backoffMaxMs);
  } finally {
    isRestartingTunnel = false;
  }
}

function scheduleTunnelRestart(reason) {
  setTimeout(() => {
    restartTunnel(reason);
  }, 1000);
}

// Periodic Watchdog Loop
async function runHealthCheck() {
  if (isShuttingDown || isRestartingTunnel) return;

  // 1. Check local backend
  const backendHealthy = await isPortResponding(CONFIG.backendPort, '/api/health');
  if (!backendHealthy) {
    log('Local Backend is not responding to /api/health!', 'WARN');
  }

  // 2. Check local frontend
  const frontendHealthy = await isPortResponding(CONFIG.frontendPort, '/');
  if (!frontendHealthy) {
    log('Local Frontend Vite server is not responding!', 'WARN');
  }

  // 3. Check public HTTPS tunnel endpoint
  if (!currentPublicUrl) {
    return;
  }

  try {
    const healthUrl = `${currentPublicUrl}/api/health`;
    const res = await fetchWithTimeout(healthUrl, CONFIG.requestTimeoutMs);

    if (res.statusCode === 200) {
      if (consecutiveFailures > 0) {
        log(`Public tunnel recovered. Status: 200 OK (${res.statusCode})`);
      }
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      log(`Public health check returned HTTP ${res.statusCode} (failures: ${consecutiveFailures}/${CONFIG.maxConsecutiveFailures})`, 'WARN');
      
      if (consecutiveFailures >= CONFIG.maxConsecutiveFailures) {
        await restartTunnel(`Public health returned HTTP ${res.statusCode}`);
      }
    }
  } catch (err) {
    consecutiveFailures++;
    log(`Public tunnel unreachable: ${err.message} (failures: ${consecutiveFailures}/${CONFIG.maxConsecutiveFailures})`, 'WARN');

    if (consecutiveFailures >= CONFIG.maxConsecutiveFailures) {
      await restartTunnel(`Connection error: ${err.message}`);
    }
  }
}

// Clean Shutdown Handler
function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Tunnel Supervisor] Received ${signal}. Shutting down all processes cleanly...`);

  if (cloudflaredProc) {
    try { cloudflaredProc.kill('SIGINT'); } catch (e) {}
  }
  if (backendProc) {
    try { backendProc.kill('SIGINT'); } catch (e) {}
  }
  if (frontendProc) {
    try { frontendProc.kill('SIGINT'); } catch (e) {}
  }

  try {
    if (fs.existsSync(PUBLIC_URL_FILE)) {
      fs.unlinkSync(PUBLIC_URL_FILE);
    }
  } catch (e) {}

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGHUP', () => handleShutdown('SIGHUP'));

// Main Entry Point
async function main() {
  log('=== Initializing CampusOne Public Access Supervisor ===');

  try {
    await ensureBackend();
    await ensureFrontend();
    await startTunnel();

    // Start health check watchdog timer
    setInterval(runHealthCheck, CONFIG.healthCheckIntervalMs);

    log(`Watchdog loop active. Checking every ${CONFIG.healthCheckIntervalMs / 1000}s.`);
  } catch (err) {
    log(`Startup failure: ${err.message}`, 'ERROR');
    handleShutdown('STARTUP_FAILURE');
  }
}

main();
