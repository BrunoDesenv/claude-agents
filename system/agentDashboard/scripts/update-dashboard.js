#!/usr/bin/env node
/**
 * update-dashboard.js — Agent Command Center state writer
 * Zero npm dependencies. Uses only node:http built-ins.
 * Fails silently if the API is unreachable.
 *
 * Usage:
 *   node update-dashboard.js session-start --session-id <uuid> --task "..." --started <iso>
 *   node update-dashboard.js agent-spawn   --session-id <uuid> --agent <name> --phase "..." --model <id>
 *   node update-dashboard.js agent-done    --session-id <uuid> --agent <name> --cost <n> --status pass|fail
 *   node update-dashboard.js gate          --session-id <uuid> --gate-name "..."
 *   node update-dashboard.js gate-clear    --session-id <uuid>
 *   node update-dashboard.js session-end   --session-id <uuid> --status completed|failed --total-cost <n>
 *   node update-dashboard.js clear
 */

'use strict';

const http = require('node:http');

const API_HOST = 'localhost';
const API_PORT = 5200;
const API_PATH = '/api/dashboard/event';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

function post(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: API_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve(raw));
      }
    );
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: path,
        method: 'GET',
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve(raw));
      }
    );
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

function httpPatch(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: path,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve(raw));
      }
    );
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function main() {
  const [, , command, ...rest] = process.argv;

  if (!command) {
    process.stderr.write('Usage: node update-dashboard.js <command> [--options]\n');
    process.exit(1);
  }

  const args = parseArgs(rest);
  const sessionId = args['session-id'] || '';

  let payload = {};

  switch (command) {
    case 'session-start':
      payload = {
        task: args['task'] || '',
        started: args['started'] || new Date().toISOString(),
      };
      break;

    case 'agent-spawn':
      payload = {
        agent: args['agent'] || '',
        phase: args['phase'] || '',
        model: args['model'] || '',
      };
      break;

    case 'agent-done':
      payload = {
        agent: args['agent'] || '',
        cost: parseFloat(args['cost'] || '0'),
        status: args['status'] || 'pass',
      };
      break;

    case 'agent-cost-update':
      payload = {
        agent: args['agent'] || '',
        cost: parseFloat(args['cost'] || '0'),
      };
      break;

    case 'gate':
      payload = { gateName: args['gate-name'] || '' };
      break;

    case 'gate-clear':
      payload = {};
      break;

    case 'session-end':
      payload = {
        status: args['status'] || 'completed',
        totalCost: parseFloat(args['total-cost'] || '0'),
      };
      break;

    case 'clear':
      payload = {};
      break;

    case 'poll-messages': {
      try {
        const path = `/api/dashboard/messages?sessionId=${encodeURIComponent(sessionId)}&status=pending`;
        const raw = await httpGet(path);
        process.stdout.write(raw);
      } catch (err) {
        process.stderr.write(`poll-messages error: ${err.message}\n`);
        process.stdout.write('[]');
      }
      process.exit(0);
    }

    case 'agent-reply': {
      const messageId = args['message-id'] || '';
      const replyFile = args['reply-file'] || '';
      try {
        const fs = require('node:fs');
        const replyContent = fs.readFileSync(replyFile, 'utf8').replace(/^﻿/, '');
        const patchPath = `/api/dashboard/messages/${encodeURIComponent(messageId)}/reply`;
        await httpPatch(patchPath, { reply: replyContent });
        try { fs.unlinkSync(replyFile); } catch { /* best-effort delete */ }
      } catch (err) {
        process.stderr.write(`agent-reply error: ${err.message}\n`);
      }
      process.exit(0);
    }

    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.exit(1);
  }

  const body = { type: command, sessionId, payload };

  try {
    await post(body);
    process.exit(0);
  } catch {
    // Fail silently — master must not break if dashboard is down
    process.exit(1);
  }
}

main();
