import { ENV } from '../config/env';
import { FrontendState, WsIncoming } from '../types';

interface AgentSocketOptions {
  onToolCall: (tool: string, params: Record<string, any>, speak?: string) => void;
  onClarify: (question: string) => void;
  onError: (msg: string) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void;
}

export class AgentSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: string[] = [];
  
  private onToolCall: AgentSocketOptions['onToolCall'];
  private onClarify: AgentSocketOptions['onClarify'];
  private onError: AgentSocketOptions['onError'];
  private onStatusChange: AgentSocketOptions['onStatusChange'];

  constructor(options: AgentSocketOptions) {
    // Backenddagi `\w+` (faqat harf, son, _) regex ishlashi uchun chiziqchalarni olib tashlaymiz
    this.sessionId = crypto.randomUUID().replace(/-/g, '');
    this.onToolCall = options.onToolCall;
    this.onClarify = options.onClarify;
    this.onError = options.onError;
    this.onStatusChange = options.onStatusChange;
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined') return;
    
    this.onStatusChange('connecting');
    try {
      // Backend (Django) `ws/agent/<session_id>/` formatini kutmoqda!
      let wsUrl = ENV.WS_AGENT.endsWith('/') 
        ? `${ENV.WS_AGENT}${this.sessionId}/` 
        : `${ENV.WS_AGENT}/${this.sessionId}/`;
        
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Tizimga kirmagan bo'lsa, backend ulanishni darhol yopadi va xato beradi (AnonymousUser)
        // Shuning uchun token yo'q bo'lsa ulanishga urinmaymiz.
        this.onStatusChange('disconnected');
        return;
      }
      wsUrl += `?token=${token}`;
        
      this.ws = new WebSocket(wsUrl);
      this.bindEvents();
    } catch (e) {
      console.error('Failed to create WebSocket instance', e);
      this.onError('Server bilan aloqa ornatib bolmadi.');
    }
  }

  private bindEvents() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatusChange('connected');
      
      // Flush queue
      while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
        const msg = this.messageQueue.shift();
        if (msg) this.ws.send(msg);
      }
    };

    this.ws.onmessage = (event) => {
      let data: WsIncoming;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.error("Noto'g'ri JSON:", event.data);
        return;
      }

      if (data.type === 'tool_call') {
        this.onToolCall(data.tool, data.params, data.speak);
      } else if (data.type === 'clarify') {
        this.onClarify(data.question);
      } else if (data.type === 'error') {
        this.onError(data.message || "Noma'lum xatolik");
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange('disconnected');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      } else {
        this.onError("Serverga ulanib bo'lmadi. Iltimos sahifani yangilang.");
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket xato:", err);
      // onerror is usually followed by onclose, so we let onclose handle reconnection logic
    };
  }

  public send(text: string, frontendState: FrontendState) {
    const payload = JSON.stringify({
      type: "user_command",
      text,
      session_id: this.sessionId,
      frontend_state: frontendState,
    });
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.messageQueue.push(payload);
      // Attempt to connect if disconnected
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
         this.connect();
      }
    }
  }
  
  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
