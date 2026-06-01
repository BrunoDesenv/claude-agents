import { Component, Input, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { LogEntry } from '../../core/dashboard.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-log-panel',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="log-panel">
      <div class="log-header">
        <span>Event Log</span>
        <span class="log-count">{{ entries.length }} events</span>
      </div>
      <div class="log-body" #logBody>
        @for (entry of entries; track $index) {
          <div class="log-entry" [ngClass]="entry.type">
            <span class="log-time">{{ entry.time }}</span>
            @if (entry.agent) {
              <span class="log-agent" [style.color]="agentColor(entry.agent)">{{ entry.agent }}</span>
            }
            <span class="log-msg">{{ entry.message }}</span>
          </div>
        }
        @if (!entries.length) {
          <div class="log-empty">Waiting for session…</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .log-panel {
      display: flex;
      flex-direction: column;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      height: 100%;
      overflow: hidden;
    }
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
    }
    .log-count { font-weight: 400; font-size: 0.7rem; }
    .log-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }
    .log-entry {
      display: flex;
      gap: 8px;
      align-items: baseline;
      padding: 3px 14px;
      font-size: 0.72rem;
      border-left: 2px solid transparent;
      transition: background 0.15s;
    }
    .log-entry:hover { background: rgba(255,255,255,0.04); }
    .log-entry.session-start  { border-left-color: #a78bfa; }
    .log-entry.agent-spawn    { border-left-color: #34d399; }
    .log-entry.agent-done     { border-left-color: #60a5fa; }
    .log-entry.gate           { border-left-color: #fbbf24; }
    .log-entry.gate-clear     { border-left-color: #6b7280; }
    .log-entry.session-end    { border-left-color: #f87171; }
    .log-time {
      color: #6b7280;
      min-width: 54px;
      flex-shrink: 0;
    }
    .log-agent {
      font-weight: 700;
      min-width: 78px;
      flex-shrink: 0;
    }
    .log-msg { color: #d1d5db; }
    .log-empty { padding: 24px 14px; color: #6b7280; font-size: 0.8rem; }
  `]
})
export class LogPanelComponent implements AfterViewChecked {
  @Input() entries: LogEntry[] = [];
  @ViewChild('logBody') logBody!: ElementRef<HTMLDivElement>;

  private prevLength = 0;

  ngAfterViewChecked(): void {
    if (this.entries.length !== this.prevLength) {
      this.prevLength = this.entries.length;
      const el = this.logBody?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  agentColor(agent: string): string {
    const colorMap: Record<string, string> = {
      master: '#a78bfa', architect: '#60a5fa', backend: '#34d399',
      frontend: '#22d3ee', qa: '#fb923c', validator: '#f87171',
      researcher: '#fbbf24', ux: '#f472b6', documentation: '#9ca3af',
      forge: '#d97706',
    };
    return colorMap[agent] ?? '#9ca3af';
  }
}
