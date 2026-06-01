import { Component, Input } from '@angular/core';
import { AgentState } from '../../core/dashboard.service';
import { AgentSvgComponent } from '../../shared/agent-svg/agent-svg.component';
import { getAgentConfig } from '../../core/agent-config';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [AgentSvgComponent],
  template: `
    <div class="agent-card" [class]="agent.status" [style.--agent-color]="color">
      <app-agent-svg [agent]="agent.name" [status]="agent.status"/>
      <div class="card-info">
        <span class="agent-name">{{ label }}</span>
        @if (agent.phase) {
          <span class="agent-phase">{{ agent.phase }}</span>
        }
        @if (agent.costUsd > 0) {
          <span class="agent-cost">\${{ agent.costUsd.toFixed(3) }}</span>
        }
        @if (agent.model) {
          <span class="agent-model">{{ shortModel }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .agent-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 10px;
      border-radius: 12px;
      border: 2px solid transparent;
      background: rgba(255,255,255,0.04);
      transition: all 0.3s ease;
      min-width: 130px;
    }
    .agent-card.working {
      border-color: var(--agent-color);
      background: color-mix(in srgb, var(--agent-color) 8%, transparent);
      box-shadow: 0 0 20px color-mix(in srgb, var(--agent-color) 30%, transparent);
    }
    .agent-card.done {
      opacity: 0.6;
      border-color: #22c55e;
    }
    .agent-card.fail {
      opacity: 0.6;
      border-color: #ef4444;
    }
    .card-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .agent-name {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--agent-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .agent-phase {
      font-size: 0.68rem;
      color: #9ca3af;
      text-align: center;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .agent-cost {
      font-size: 0.72rem;
      color: #34d399;
      font-family: monospace;
    }
    .agent-model {
      font-size: 0.62rem;
      color: #6b7280;
      font-family: monospace;
    }
  `]
})
export class AgentCardComponent {
  @Input({ required: true }) agent!: AgentState;

  get color(): string { return getAgentConfig(this.agent.name).color; }
  get label(): string { return getAgentConfig(this.agent.name).label; }
  get shortModel(): string {
    return this.agent.model.replace('claude-', '').replace(/-\d{8}$/, '');
  }
}
