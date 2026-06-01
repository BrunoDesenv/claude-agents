import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-gate-banner',
  standalone: true,
  template: `
    <div class="gate-banner">
      <span class="gate-icon">🚦</span>
      <div class="gate-content">
        <span class="gate-label">GATE</span>
        <span class="gate-name">{{ name }}</span>
      </div>
      <div class="gate-spinner" aria-label="Awaiting gate clearance"></div>
    </div>
  `,
  styles: [`
    .gate-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 24px;
      background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08));
      border: 1.5px solid #f59e0b;
      border-radius: 10px;
      animation: gate-pulse 2s ease-in-out infinite;
    }
    .gate-icon { font-size: 1.8rem; }
    .gate-content { display: flex; flex-direction: column; gap: 2px; }
    .gate-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #f59e0b;
    }
    .gate-name {
      font-size: 1rem;
      font-weight: 600;
      color: #fef3c7;
    }
    .gate-spinner {
      width: 22px; height: 22px;
      border: 3px solid rgba(245,158,11,0.3);
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      margin-left: auto;
    }
    @keyframes gate-pulse {
      0%, 100% { box-shadow: 0 0 8px rgba(245,158,11,0.3); }
      50% { box-shadow: 0 0 22px rgba(245,158,11,0.6); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class GateBannerComponent {
  @Input({ required: true }) name!: string;
}
