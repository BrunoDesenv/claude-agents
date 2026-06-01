'use strict';
const { DatabaseSync } = require('node:sqlite');
const _dbDefault = process.env.CLAUDE_AGENTS_REPO ? require('path').join(process.env.CLAUDE_AGENTS_REPO, 'system', 'cost-tracker', 'database', 'agent-costs.db') : 'C:/Agents/system/cost-tracker/database/agent-costs.db';
const db = new DatabaseSync(process.env.AGENT_DB_PATH || _dbDefault);
db.exec('PRAGMA foreign_keys = ON');

const cutoff30 = new Date();
cutoff30.setDate(cutoff30.getDate() - 30);
const cutoff30Str = cutoff30.toISOString();

const result = {
  totalCost:          db.prepare('SELECT COALESCE(SUM(total_cost),0) AS v FROM sessions').get().v,
  cost30d:            db.prepare('SELECT COALESCE(SUM(total_cost),0) AS v FROM sessions WHERE started_at >= ?').get(cutoff30Str).v,
  sessionCount:       db.prepare('SELECT COUNT(*) AS v FROM sessions').get().v,
  avgCost:            db.prepare('SELECT COALESCE(ROUND(AVG(total_cost),4),0) AS v FROM sessions').get().v,
  mostUsedAgent:      db.prepare('SELECT agent_name, COUNT(*) AS runs FROM agent_runs GROUP BY agent_name ORDER BY runs DESC LIMIT 1').get(),
  mostExpensiveAgent: db.prepare('SELECT agent_name, ROUND(SUM(cost_usd),4) AS total_cost FROM agent_runs GROUP BY agent_name ORDER BY total_cost DESC LIMIT 1').get(),
  top5:               db.prepare('SELECT id, SUBSTR(task,1,50) AS task_preview, started_at, ROUND(total_cost,4) AS cost, status FROM sessions ORDER BY total_cost DESC LIMIT 5').all(),
  agentBreakdown:     db.prepare('SELECT agent_name, COUNT(*) AS runs, ROUND(SUM(cost_usd),4) AS total_cost, ROUND(AVG(cost_usd),4) AS avg_cost FROM agent_runs GROUP BY agent_name ORDER BY total_cost DESC').all()
};

db.close();
console.log(JSON.stringify(result));
