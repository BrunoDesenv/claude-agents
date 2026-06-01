import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

export interface AgentState {
  name: string;
  status: string;
  phase: string;
  spawnedAt: string;
  completedAt?: string;
  costUsd: number;
  model: string;
}

export interface LogEntry {
  time: string;
  type: string;
  agent?: string;
  message: string;
}

export interface DashboardMessage {
  id: string;
  sessionId: string;
  content: string;
  reply?: string;
  createdAt: string;
  repliedAt?: string;
  status: 'pending' | 'processing' | 'replied';
}

export interface DashboardState {
  sessionId: string;
  task: string;
  phase: string;
  startedAt: string;
  updatedAt: string;
  status: string;
  activeAgents: AgentState[];
  completedAgents: AgentState[];
  currentGate?: string;
  totalCostUsd: number;
  log: LogEntry[];
}

const EMPTY_STATE: DashboardState = {
  sessionId: '',
  task: '',
  phase: '',
  startedAt: '',
  updatedAt: '',
  status: 'idle',
  activeAgents: [],
  completedAgents: [],
  totalCostUsd: 0,
  log: [],
};

const API = 'http://localhost:5200';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly state = signal<DashboardState>(EMPTY_STATE);
  readonly connected = signal(false);
  readonly messages = signal<DashboardMessage[]>([]);

  private hub: signalR.HubConnection;

  constructor() {
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${API}/dashboardHub`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hub.on('StateUpdated', (newState: DashboardState) => {
      this.state.set(newState);
    });

    this.hub.on('MessageReceived', (msg: DashboardMessage) => {
      this.messages.update(msgs => {
        let idx = -1;
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].status === 'pending' && msgs[i].content === msg.content) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          const copy = [...msgs];
          copy[idx] = msg;
          return copy;
        }
        return [...msgs, msg];
      });
    });

    this.hub.on('MessageReplied', (msg: DashboardMessage) => {
      this.messages.update(msgs => msgs.map(m => m.id === msg.id ? msg : m));
    });

    this.hub.onreconnected(async () => {
      this.connected.set(true);
      await this.fetchState();
      await this.fetchMessages(this.state().sessionId);
    });
    this.hub.onclose(() => this.connected.set(false));

    this.startConnection();
  }

  private async startConnection(): Promise<void> {
    try {
      await this.hub.start();
      this.connected.set(true);
      await this.fetchState();
      await this.fetchMessages(this.state().sessionId);
    } catch {
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  private async fetchState(): Promise<void> {
    try {
      const resp = await fetch(`${API}/api/dashboard/state`);
      if (resp.ok) {
        const s: DashboardState = await resp.json();
        this.state.set(s);
      }
    } catch { /* best-effort */ }
  }

  private async fetchMessages(sessionId: string): Promise<void> {
    if (!sessionId) return;
    try {
      const resp = await fetch(
        `${API}/api/dashboard/messages?sessionId=${encodeURIComponent(sessionId)}&status=all`
      );
      if (resp.ok) {
        const msgs: DashboardMessage[] = await resp.json();
        this.messages.set(msgs);
      }
    } catch { /* best-effort */ }
  }

  async sendMessage(content: string): Promise<void> {
    const optimistic: DashboardMessage = {
      id: crypto.randomUUID(),
      sessionId: this.state().sessionId,
      content,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.messages.update(msgs => [...msgs, optimistic]);
    try {
      const resp = await fetch(`${API}/api/dashboard/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: optimistic.sessionId, content }),
      });
      if (resp.ok) {
        const confirmed: DashboardMessage = await resp.json();
        this.messages.update(msgs => msgs.map(m => m.id === optimistic.id ? confirmed : m));
      }
    } catch { /* best-effort: leave optimistic entry visible */ }
  }
}
