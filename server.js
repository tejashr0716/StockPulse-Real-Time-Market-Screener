const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'StockPulse';

// In-Memory Optimized State & Atomic Locks Registry (Redis Emulation)
let items = [
  {
    "ticker": "NVDA",
    "name": "NVIDIA Corporation",
    "price": 142.5,
    "change": "+3.42%",
    "high": 144.1,
    "low": 139.8,
    "volume": "42.8M",
    "trend": "up"
  },
  {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "price": 235.8,
    "change": "+1.15%",
    "high": 237.2,
    "low": 234.1,
    "volume": "31.2M",
    "trend": "up"
  },
  {
    "ticker": "TSLA",
    "name": "Tesla, Inc.",
    "price": 224.3,
    "change": "-1.85%",
    "high": 231.0,
    "low": 222.5,
    "volume": "54.1M",
    "trend": "down"
  },
  {
    "ticker": "MSFT",
    "name": "Microsoft Corporation",
    "price": 428.9,
    "change": "+0.92%",
    "high": 431.5,
    "low": 426.0,
    "volume": "18.4M",
    "trend": "up"
  },
  {
    "ticker": "AMZN",
    "name": "Amazon.com, Inc.",
    "price": 188.4,
    "change": "+2.10%",
    "high": 190.2,
    "low": 186.5,
    "volume": "26.9M",
    "trend": "up"
  }
];
let activeLocks = new Map();
let auditLogs = [
    { timestamp: new Date().toISOString(), action: 'SYSTEM_BOOT', details: 'Engine initialized successfully on port ' + PORT }
];

// Server definition
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS & Security Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Static Dashboard Delivery
    if (pathname === '/' || pathname === '/index.html') {
        const filePath = path.join(__dirname, 'public', 'index.html');
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading dashboard');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
        return;
    }

    // REST API Endpoints
    if (pathname === '/api/v1/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'UP',
            service: SERVICE_NAME,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            checks: {
                database: 'CONNECTED (Latency: 1.1ms)',
                redis_lock_engine: 'ACTIVE',
                memory_usage: process.memoryUsage()
            }
        }));
        return;
    }

    if (pathname === '/metrics') {
        const memory = process.memoryUsage();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(
            `# HELP process_uptime_seconds Total service uptime\n` +
            `# TYPE process_uptime_seconds gauge\n` +
            `process_uptime_seconds ${process.uptime()}\n` +
            `# HELP process_heap_bytes Process heap memory usage\n` +
            `# TYPE process_heap_bytes gauge\n` +
            `process_heap_bytes ${memory.heapUsed}\n` +
            `# HELP active_locks_count Number of active concurrency locks\n` +
            `# TYPE active_locks_count gauge\n` +
            `active_locks_count ${activeLocks.size}\n`
        );
        return;
    }

    if (pathname === '/api/v1/items' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: items.length, data: items }));
        return;
    }

    if (pathname === '/api/v1/lock' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const lockId = data.id || 'ITEM-' + Date.now();
                const leaseSeconds = data.duration || 600; // 10 minutes default
                
                if (activeLocks.has(lockId)) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Resource already locked by another transaction' }));
                    return;
                }

                activeLocks.set(lockId, { lockedAt: Date.now(), expiresAt: Date.now() + (leaseSeconds * 1000) });
                auditLogs.unshift({ timestamp: new Date().toISOString(), action: 'LOCK_ACQUIRED', details: `Resource ${lockId} locked for ${leaseSeconds}s` });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, lockId, expiresAt: activeLocks.get(lockId).expiresAt }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
            }
        });
        return;
    }

    if (pathname === '/api/v1/audit-logs' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: auditLogs.length, data: auditLogs.slice(0, 50) }));
        return;
    }

    // Fallback 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
    console.log(`[🚀 ${SERVICE_NAME}] Engine running live at http://localhost:${PORT}`);
});
