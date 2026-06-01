import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { DashboardService, DashboardMessage } from '../../core/dashboard.service';

@Component({
  selector: 'app-message-panel',
  standalone: true,
  imports: [],
  template: `
    <div class="msg-panel">

      <div class="msg-header">
        <span>Messages</span>
        <span class="msg-count">{{ messages().length }}</span>
      </div>

      <div class="msg-body" #msgBody>

        @if (!messages().length) {
          <div class="msg-empty">No messages yet.</div>
        }

        @for (msg of messages(); track msg.id) {
          <div class="msg-row">

            <div class="bubble user-bubble">
              <span class="bubble-text">{{ msg.content }}</span>
              <span class="bubble-meta">
                {{ formatTime(msg.createdAt) }}
                <span class="status-icon" [class]="msg.status">{{ statusSymbol(msg.status) }}</span>
              </span>
            </div>

            @if (msg.reply) {
              <div class="bubble agent-bubble">
                <span class="bubble-text">{{ msg.reply }}</span>
                <span class="bubble-meta">{{ formatTime(msg.repliedAt!) }}</span>
              </div>
            }

          </div>
        }

      </div>

      <div class="msg-composer">
        <textarea
          class="msg-input"
          rows="2"
          maxlength="2000"
          placeholder="Send a message to the session…"
          [value]="inputText()"
          (input)="inputText.set($any($event.target).value)"
          (keydown)="onKeydown($event)"
          [disabled]="svc.state().status === 'idle' || svc.state().status === 'completed'"
        ></textarea>
        <div class="composer-footer">
          <span class="char-count" [class.near-limit]="charCount() > 1800">
            {{ charCount() }}/2000
          </span>
          <button
            class="send-btn"
            (click)="onSend()"
            [disabled]="!canSend()"
          >
            @if (sending()) { Sending… } @else { Send }
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .msg-panel {
      display: flex;
      flex-direction: column;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      height: 100%;
      overflow: hidden;
    }

    .msg-header {
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
      flex-shrink: 0;
    }
    .msg-count { font-weight: 400; font-size: 0.7rem; }

    .msg-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .msg-empty {
      color: #6b7280;
      font-size: 0.8rem;
      text-align: center;
      padding: 24px 0;
    }

    .msg-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bubble {
      max-width: 75%;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 4px;
      word-break: break-word;
    }

    .user-bubble {
      align-self: flex-end;
      background: rgba(167,139,250,0.18);
      border: 1px solid rgba(167,139,250,0.35);
      color: #e9d5ff;
    }

    .agent-bubble {
      align-self: flex-start;
      background: rgba(52,211,153,0.10);
      border: 1px solid rgba(52,211,153,0.25);
      color: #d1fae5;
    }

    .bubble-text { white-space: pre-wrap; }

    .bubble-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      color: rgba(255,255,255,0.35);
      align-self: flex-end;
    }

    .status-icon { font-size: 0.7rem; }
    .status-icon.pending    { color: #fbbf24; }
    .status-icon.processing { color: #a78bfa; animation: blink 1.2s ease-in-out infinite; }
    .status-icon.replied    { color: #34d399; }

    .msg-composer {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }

    .msg-input {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      color: #f3f4f6;
      font-size: 0.82rem;
      font-family: inherit;
      padding: 8px 10px;
      resize: none;
      outline: none;
      transition: border-color 0.15s;
    }
    .msg-input:focus { border-color: rgba(167,139,250,0.5); }
    .msg-input:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .composer-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .char-count {
      font-size: 0.65rem;
      color: #6b7280;
      font-family: monospace;
    }
    .char-count.near-limit { color: #fbbf24; }

    .send-btn {
      padding: 5px 16px;
      border-radius: 6px;
      border: 1px solid rgba(167,139,250,0.4);
      background: rgba(167,139,250,0.15);
      color: #e9d5ff;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }
    .send-btn:hover:not(:disabled) {
      background: rgba(167,139,250,0.28);
    }
    .send-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `]
})
export class MessagePanelComponent implements AfterViewChecked {
  readonly svc = inject(DashboardService);

  readonly messages = this.svc.messages;

  readonly inputText = signal('');
  readonly sending = signal(false);

  readonly canSend = computed(() =>
    !this.sending() &&
    this.inputText().trim().length > 0 &&
    this.inputText().length <= 2000 &&
    this.svc.state().status === 'running'
  );

  readonly charCount = computed(() => this.inputText().length);

  readonly pendingCount = computed(() =>
    this.svc.messages().filter(m => m.status === 'pending').length
  );

  @ViewChild('msgBody') msgBody!: ElementRef<HTMLDivElement>;
  private prevMsgCount = 0;

  ngAfterViewChecked(): void {
    if (this.messages().length !== this.prevMsgCount) {
      this.prevMsgCount = this.messages().length;
      const el = this.msgBody?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  async onSend(): Promise<void> {
    const text = this.inputText().trim();
    if (!this.canSend() || !text) return;
    this.sending.set(true);
    this.inputText.set('');
    await this.svc.sendMessage(text);
    this.sending.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  statusSymbol(status: DashboardMessage['status']): string {
    const map: Record<DashboardMessage['status'], string> = {
      pending:    '●',
      processing: '◎',
      replied:    '✓',
    };
    return map[status];
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
