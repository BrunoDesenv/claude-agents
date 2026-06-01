import { Component, inject, computed } from '@angular/core';
import { DashboardService } from '../../core/dashboard.service';
import { AgentCardComponent } from './agent-card.component';
import { GateBannerComponent } from './gate-banner.component';
import { LogPanelComponent } from './log-panel.component';
import { MessagePanelComponent } from './message-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AgentCardComponent, GateBannerComponent, LogPanelComponent, MessagePanelComponent],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <header class="dash-header">
        <div class="header-left">
          <h1 class="title">Agent Command Center</h1>
          @if (state().task) {
            <span class="session-task">{{ state().task }}</span>
          }
        </div>
        <div class="header-right">
          <div class="cost-display">
            <span class="cost-label">Total Cost</span>
            <span class="cost-value">\${{ state().totalCostUsd.toFixed(4) }}</span>
          </div>
          <div class="status-badge" [class]="state().status">
            <span class="status-dot-small"></span>
            {{ state().status }}
          </div>
          <div class="conn-indicator" [class.connected]="svc.connected()">
            {{ svc.connected() ? '● Connected' : '○ Connecting…' }}
          </div>
        </div>
      </header>

      <!-- Phase bar -->
      @if (state().phase) {
        <div class="phase-bar">
          <span class="phase-label">Phase</span>
          <span class="phase-name">{{ state().phase }}</span>
        </div>
      }

      <!-- Gate banner -->
      @if (state().currentGate) {
        <app-gate-banner [name]="state().currentGate!"/>
      }

      <!-- Message panel -->
      <section class="msgs">
        <app-message-panel/>
      </section>

      <!-- Main workspace -->
      <main class="workspace">
        <!-- Active agents -->
        <section class="agent-zone active-zone">
          <h2 class="zone-title">Active</h2>
          <div class="agent-grid">
            @for (agent of state().activeAgents; track agent.name) {
              <app-agent-card [agent]="agent"/>
            }
            @if (!state().activeAgents.length && state().status === 'idle') {
              <div class="idle-message">
                <p>No active session</p>
                <p class="idle-hint">Run <code>node update-dashboard.js session-start …</code> to begin</p>
              </div>
            }
          </div>
        </section>

        <!-- Completed agents -->
        @if (state().completedAgents.length) {
          <section class="agent-zone completed-zone">
            <h2 class="zone-title">Completed</h2>
            <div class="agent-grid compact">
              @for (agent of state().completedAgents; track agent.name + agent.completedAt) {
                <app-agent-card [agent]="agent"/>
              }
            </div>
          </section>
        }
      </main>

      <!-- Log panel -->
      <aside class="log-aside">
        <app-log-panel [entries]="state().log"/>
      </aside>
    </div>
  `,
  styles: [`
    .dashboard {
      display: grid;
      grid-template-rows: auto auto auto auto 1fr;
      grid-template-columns: 1fr 320px;
      grid-template-areas:
        "header  header"
        "phase   phase"
        "gate    gate"
        "msgs    msgs"
        "main    log";
      height: 100vh;
      gap: 0;
      background: #0f0f14;
      color: #f3f4f6;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .dash-header {
      grid-area: header;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      background: rgba(0,0,0,0.4);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .header-left { display: flex; align-items: baseline; gap: 16px; }
    .title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #a78bfa; }
    .session-task {
      font-size: 0.82rem;
      color: #9ca3af;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .header-right { display: flex; align-items: center; gap: 20px; }
    .cost-display { display: flex; flex-direction: column; align-items: flex-end; }
    .cost-label { font-size: 0.62rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
    .cost-value { font-size: 1.1rem; font-weight: 700; font-family: monospace; color: #34d399; }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: rgba(107,114,128,0.2);
      color: #9ca3af;
    }
    .status-badge.running { background: rgba(52,211,153,0.15); color: #34d399; }
    .status-badge.completed { background: rgba(96,165,250,0.15); color: #60a5fa; }
    .status-badge.failed { background: rgba(248,113,113,0.15); color: #f87171; }
    .status-dot-small {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: currentColor;
      animation: blink 1.2s ease-in-out infinite;
    }
    .conn-indicator {
      font-size: 0.68rem;
      color: #6b7280;
      font-family: monospace;
    }
    .conn-indicator.connected { color: #34d399; }

    .phase-bar {
      grid-area: phase;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 24px;
      background: rgba(167,139,250,0.08);
      border-bottom: 1px solid rgba(167,139,250,0.15);
    }
    .phase-label {
      font-size: 0.62rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #7c3aed;
    }
    .phase-name { font-size: 0.85rem; color: #e9d5ff; }

    app-gate-banner {
      grid-area: gate;
      margin: 8px 24px;
    }

    .workspace {
      grid-area: main;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
      padding: 16px 24px;
    }
    .agent-zone { margin-bottom: 24px; }
    .zone-title {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      margin: 0 0 12px 0;
    }
    .agent-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .agent-grid.compact app-agent-card { transform: scale(0.85); transform-origin: top left; }

    .idle-message {
      color: #6b7280;
      font-size: 0.9rem;
      padding: 48px 0;
    }
    .idle-message p { margin: 0 0 8px; }
    .idle-hint { font-size: 0.78rem; }
    code {
      background: rgba(255,255,255,0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }

    .msgs {
      grid-area: msgs;
      padding: 0 24px 8px;
      max-height: 280px;
      overflow: hidden;
    }

    .log-aside {
      grid-area: log;
      border-left: 1px solid rgba(255,255,255,0.06);
      height: 100%;
      overflow: hidden;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class DashboardComponent {
  svc = inject(DashboardService);
  state = this.svc.state;
}
