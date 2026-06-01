import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { getAgentConfig } from '../../core/agent-config';

@Component({
  selector: 'app-agent-svg',
  standalone: true,
  template: `
    <div class="char-wrapper" [class]="status" [style.--agent-color]="color">
      <div class="glow-ring" aria-hidden="true"></div>
      <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" class="char-svg">
        <g [innerHTML]="svgContent"></g>
        <circle cx="108" cy="12" r="7" [attr.fill]="statusDotColor" class="status-dot"/>
      </svg>
      <div class="burst" aria-hidden="true">
        @if (status === 'done') { <span>✅</span> }
        @if (status === 'fail') { <span>❌</span> }
      </div>
    </div>
  `,
  styles: [`
    .char-wrapper {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      transform-origin: bottom center;
    }
    .char-svg { width: 120px; height: 160px; overflow: visible; }
    .glow-ring {
      position: absolute;
      inset: 10px;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
    }
    .burst {
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 1.4rem;
      opacity: 0;
      pointer-events: none;
    }

    /* idle */
    .idle .char-svg { animation: breathe 2.5s ease-in-out infinite; }

    /* working */
    .working .char-svg { animation: sway 1.5s ease-in-out infinite; }
    .working .glow-ring {
      opacity: 1;
      animation: glow-pulse 1.5s ease-in-out infinite;
      background: radial-gradient(circle, var(--agent-color, #7c3aed) 0%, transparent 70%);
    }

    /* waiting */
    .waiting .char-svg { animation: pulse-wait 2s ease-in-out infinite; }

    /* done */
    .done .char-svg { animation: wave-done 0.6s ease-out forwards; }
    .done .burst { animation: burst-pop 0.4s ease-out 0.1s forwards; }

    /* fail */
    .fail .char-svg { animation: shake-fail 0.5s ease-out forwards; }
    .fail .burst { animation: burst-pop 0.4s ease-out forwards; }

    @keyframes breathe {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.025); }
    }
    @keyframes sway {
      0%, 100% { transform: rotate(-4deg) translateY(0); }
      50% { transform: rotate(4deg) translateY(-3px); }
    }
    @keyframes glow-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.15); }
    }
    @keyframes pulse-wait {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.65; transform: scale(0.97); }
    }
    @keyframes wave-done {
      0% { transform: rotate(0); }
      30% { transform: rotate(18deg); }
      60% { transform: rotate(-12deg); }
      80% { transform: rotate(8deg); }
      100% { transform: rotate(0) scale(0.9); }
    }
    @keyframes shake-fail {
      0%, 100% { transform: translateX(0); }
      15% { transform: translateX(-10px); }
      30% { transform: translateX(10px); }
      45% { transform: translateX(-7px); }
      60% { transform: translateX(7px); }
      75% { transform: translateX(-3px); }
    }
    @keyframes burst-pop {
      0% { opacity: 0; transform: scale(0.3); }
      60% { opacity: 1; transform: scale(1.3); }
      100% { opacity: 1; transform: scale(1); }
    }
  `]
})
export class AgentSvgComponent {
  @Input() agent = 'master';
  @Input() status = 'idle';

  private sanitizer = inject(DomSanitizer);

  get color(): string {
    return getAgentConfig(this.agent).color;
  }

  get svgContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(getAgentConfig(this.agent).svgContent);
  }

  get statusDotColor(): string {
    switch (this.status) {
      case 'working': return '#22c55e';
      case 'waiting': return '#f59e0b';
      case 'done':    return '#22c55e';
      case 'fail':    return '#ef4444';
      default:        return '#6b7280';
    }
  }
}
