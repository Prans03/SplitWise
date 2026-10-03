// ============================================================
// src/api/ws.ts – WebSocket client with auto-reconnect
// ============================================================
import { API_URL, getToken } from './client';

type WsEventHandler = (event: Record<string, unknown>) => void;

class SplitWiseWsClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<WsEventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;
  private reconnectDelay = 2000;

  async connect() {
    this.shouldConnect = true;
    this.reconnectDelay = 2000;
    await this.doConnect();
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, 'logout');
    this.ws = null;
  }

  on(event: string, handler: WsEventHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  send(msg: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private async doConnect() {
    const token = await getToken();
    if (!token || !this.shouldConnect) return;

    const wsUrl = API_URL.replace(/^http/, 'ws') + `/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      console.log('[ws] connected');
      this.reconnectDelay = 2000; // reset backoff
      this.emit('connected', {});
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Record<string, unknown>;
        if (msg.type) this.emit(msg.type as string, msg);
        this.emit('*', msg); // catch-all
      } catch { /* ignore */ }
    };

    ws.onclose = (e) => {
      console.log(`[ws] closed (${e.code})`);
      this.emit('disconnected', { code: e.code });
      if (this.shouldConnect && e.code !== 4001 && e.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      this.emit('error', {});
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(async () => {
      console.log(`[ws] reconnecting...`);
      await this.doConnect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000);
    }, this.reconnectDelay);
  }

  private emit(event: string, data: Record<string, unknown>) {
    this.handlers.get(event)?.forEach((h) => h(data));
  }
}

export const wsClient = new SplitWiseWsClient();
