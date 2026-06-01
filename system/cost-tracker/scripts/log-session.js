#!/usr/bin/env node
'use strict';

// Suppress node:sqlite ExperimentalWarning (Node.js 22+)
const _emitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...args) => {
  if (typeof warning === 'string' && warning.includes('SQLite is an experimental feature')) return;
  _emitWarning(warning, ...args);
};

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.AGENT_DB_PATH ||
  path.join(process.env.CLAUDE_AGENTS_REPO || 'C:\\Agents', 'system', 'cost-tracker', 'database', 'agent-costs.db');
const DB_DIR  = path.dirname(DB_PATH);

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  task         TEXT NOT NULL,
  started_at   TEXT NOT NULL,
  finished_at  TEXT,
  total_cost   REAL    DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  session_dir  TEXT,
  status       TEXT DEFAULT 'partial'
    CHECK(status IN ('completed', 'failed', 'partial'))
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT    NOT NULL REFERENCES sessions(id),
  agent_name   TEXT    NOT NULL,
  model        TEXT    NOT NULL,
  phase        TEXT    NOT NULL,
  attempt      INTEGER DEFAULT 1,
  tokens_in    INTEGER DEFAULT 0,
  tokens_out   INTEGER DEFAULT 0,
  cost_usd     REAL    DEFAULT 0,
  duration_ms  INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'pass'
    CHECK(status IN ('pass', 'fail', 'blocked')),
  UNIQUE(session_id, agent_name, phase, attempt)
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_session_id ON agent_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at   ON sessions(started_at);
`;

function openDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  return db;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key  = argv[i].slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        opts[key] = next;
        i++;
      } else {
        opts[key] = true;
      }
    }
  }
  return opts;
}

function cmd_session(db, opts) {
  const id = opts['id'];
  if (!id) {
    console.error('Error: --id is required for the session command');
    process.exit(1);
  }

  let task = opts['task'] || null;
  const taskFile = opts['task-file'];
  if (taskFile) {
    if (!fs.existsSync(taskFile)) {
      console.error(`Error: --task-file not found: ${taskFile}`);
      process.exit(1);
    }
    task = fs.readFileSync(taskFile, 'utf8').trim();
  }

  const started  = opts['started']      || null;
  const finished = opts['finished']     || null;
  const cost     = opts['total-cost']   != null ? parseFloat(opts['total-cost'])     : null;
  const tokens   = opts['total-tokens'] != null ? parseInt(opts['total-tokens'], 10) : null;
  const dir      = opts['session-dir']  || null;
  const status   = opts['status']       || null;

  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id);

  if (!existing) {
    if (!task) {
      console.error('Error: --task or --task-file is required when creating a new session');
      process.exit(1);
    }
    if (!started) {
      console.error('Error: --started is required when creating a new session');
      process.exit(1);
    }
    db.prepare(`
      INSERT INTO sessions (id, task, started_at, finished_at, total_cost, total_tokens, session_dir, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, task, started, finished, cost ?? 0, tokens ?? 0, dir, status ?? 'partial');
    console.log(`Session created: ${id} (${status ?? 'partial'})`);
  } else {
    db.prepare(`
      UPDATE sessions SET
        task         = COALESCE(?, task),
        started_at   = COALESCE(?, started_at),
        finished_at  = COALESCE(?, finished_at),
        total_cost   = COALESCE(?, total_cost),
        total_tokens = COALESCE(?, total_tokens),
        session_dir  = COALESCE(?, session_dir),
        status       = COALESCE(?, status)
      WHERE id = ?
    `).run(task, started, finished, cost, tokens, dir, status, id);
    console.log(`Session updated: ${id} (${status ?? 'unchanged'})`);
  }
}

function cmd_agent(db, opts) {
  const sessionId = opts['session-id'];
  const agentName = opts['agent'];
  const model     = opts['model'];
  const phase     = opts['phase'];
  const attempt   = opts['attempt']     != null ? parseInt(opts['attempt'], 10)     : 1;
  const tokensIn  = opts['tokens-in']   != null ? parseInt(opts['tokens-in'], 10)   : 0;
  const tokensOut = opts['tokens-out']  != null ? parseInt(opts['tokens-out'], 10)  : 0;
  const cost      = opts['cost']        != null ? parseFloat(opts['cost'])          : 0;
  const duration  = opts['duration-ms'] != null ? parseInt(opts['duration-ms'], 10) : 0;
  const status    = opts['status']      || 'pass';

  if (!sessionId || !agentName || !model || !phase) {
    console.error('Error: --session-id, --agent, --model, and --phase are required for the agent command');
    process.exit(1);
  }

  db.prepare(`
    INSERT INTO agent_runs (session_id, agent_name, model, phase, attempt, tokens_in, tokens_out, cost_usd, duration_ms, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, agent_name, phase, attempt) DO UPDATE SET
      model       = excluded.model,
      tokens_in   = excluded.tokens_in,
      tokens_out  = excluded.tokens_out,
      cost_usd    = excluded.cost_usd,
      duration_ms = excluded.duration_ms,
      status      = excluded.status
  `).run(sessionId, agentName, model, phase, attempt, tokensIn, tokensOut, cost, duration, status);

  console.log(`Agent run logged: ${agentName} / ${phase} / attempt ${attempt} ($${cost.toFixed(4)})`);
}

function formatTable(rows) {
  if (!rows.length) { console.log('(no results)'); return; }
  console.table(rows);
}

function formatJson(rows) {
  console.log(JSON.stringify(rows, null, 2));
}

function formatCsv(rows) {
  if (!rows.length) { console.log('(no results)'); return; }
  const headers = Object.keys(rows[0]);
  console.log(headers.join(','));
  rows.forEach(row => {
    const line = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    });
    console.log(line.join(','));
  });
}

function cmd_query(db, opts) {
  const agent  = opts['agent']  || null;
  const last   = opts['last']   != null ? parseInt(opts['last'], 10) : 10;
  const format = opts['format'] || 'table';
  const limitSql = last > 0 ? `LIMIT ${last}` : '';

  let rows;
  if (agent) {
    rows = db.prepare(`
      SELECT
        s.id         AS session_id,
        s.task,
        s.started_at,
        a.agent_name,
        a.model,
        a.phase,
        a.attempt,
        a.tokens_in,
        a.tokens_out,
        a.cost_usd,
        a.duration_ms,
        a.status
      FROM agent_runs a
      JOIN sessions s ON s.id = a.session_id
      WHERE a.agent_name = ?
      ORDER BY s.started_at DESC
      ${limitSql}
    `).all(agent);
  } else {
    rows = db.prepare(`
      SELECT id, task, started_at, finished_at, total_cost, total_tokens, session_dir, status
      FROM sessions
      ORDER BY started_at DESC
      ${limitSql}
    `).all();
  }

  if (format === 'json')     formatJson(rows);
  else if (format === 'csv') formatCsv(rows);
  else                       formatTable(rows);
}

function main() {
  const args    = process.argv.slice(2);
  const command = args[0];
  const opts    = parseArgs(args.slice(1));

  let db;
  try {
    db = openDb();
  } catch (err) {
    console.error(`Failed to open database: ${err.message}`);
    process.exit(1);
  }

  try {
    switch (command) {
      case 'session': cmd_session(db, opts); break;
      case 'agent':   cmd_agent(db, opts);   break;
      case 'query':   cmd_query(db, opts);   break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: node log-session.js <session|agent|query> [options]');
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    if (db) db.close();
  }
}

main();
