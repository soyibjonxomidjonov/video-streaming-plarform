import { AgentSocket } from './AgentSocket';
import { VoiceInput } from './VoiceInput';
import { tryFastPath } from './fastPath';
import { FrontendState, VoiceState } from '../types';

// Bu funksiyalar UI/Player orqali ta'minlanadi
export interface DispatcherOptions {
  onStateChange: (state: VoiceState) => void;
  onSocketStatusChange: (status: string) => void;
  getFrontendState: () => FrontendState;
  
  // Amallar
  executePlaybackAction: (tool: string, params: any) => Promise<boolean>;
  executeApiAction: (tool: string, params: any) => Promise<boolean>;
  speak: (text: string) => Promise<void>;
  
  // Tasdiqlash
  requestConfirmation: (tool: string, params: any) => Promise<boolean>;
}

export class VoiceDispatcher {
  private agentSocket: AgentSocket | null = null;
  private voiceInput: VoiceInput | null = null;
  private options: DispatcherOptions;
  
  private currentState: VoiceState = 'idle';

  // Front-endda to'g'ridan-to'g'ri bajariladigan xavfsiz komandalar (fastPath)
  private readonly FRONTEND_ONLY_TOOLS = [
    'pause_video', 'play_video', 'seek_forward', 'seek_backward', 'seek_to_time',
    'set_volume', 'increase_volume', 'decrease_volume', 'mute', 'unmute',
    'toggle_fullscreen', 'enter_fullscreen', 'exit_fullscreen', 
    'toggle_picture_in_picture', 'exit_picture_in_picture',
    'toggle_captions', 'enable_captions', 'disable_captions',
    'toggle_theater_mode', 'close_player', 'set_playback_speed',
    'restart_episode', 'next_episode', 'previous_episode',
    'scroll_down', 'scroll_up', 'scroll_to_top', 'scroll_to_bottom',
    'go_back', 'refresh_page', 'go_home', 'open_favorites_page',
    'open_search_page', 'open_profile_page', 'stop_listening'
  ];

  // Destructive actions that need confirmation
  private readonly DESTRUCTIVE_TOOLS = [
    'clear_watch_history', 'delete_comment', 'remove_from_favorites', 'logout'
  ];

  constructor(options: DispatcherOptions) {
    this.options = options;
  }

  public init() {
    this.agentSocket = new AgentSocket({
      onToolCall: this.handleToolCall.bind(this),
      onClarify: this.handleClarify.bind(this),
      onError: this.handleError.bind(this),
      onStatusChange: (status) => this.options.onSocketStatusChange(status),
    });

    this.voiceInput = new VoiceInput({
      onListeningStart: () => this.setState('listening'),
      onListeningStop: () => {
         if (this.currentState === 'listening') {
            this.setState('idle');
         }
      },
      onSpeechDetected: () => {
         // Optionally show visual feedback that speech is being heard
      },
      onSpeechResult: this.handleSpeechResult.bind(this),
      onError: this.handleError.bind(this),
    });
  }

  public startListening() {
    if (this.voiceInput) {
      this.voiceInput.start();
    }
  }

  public stopListening() {
    if (this.voiceInput) {
      this.voiceInput.stop();
    }
  }
  
  public destroy() {
    this.stopListening();
    if (this.agentSocket) {
      this.agentSocket.close();
    }
  }

  private setState(state: VoiceState) {
    this.currentState = state;
    this.options.onStateChange(state);
  }

  private async handleSpeechResult(text: string) {
    if (!text) {
      this.setState('idle');
      return;
    }

    this.setState('thinking');
    
    // Layer 0: Fast Path Regex Matching
    const fastMatch = tryFastPath(text);
    
    if (fastMatch) {
      if (fastMatch.tool === 'stop_listening') {
        this.setState('idle');
        return;
      }
      
      const success = await this.executeAction(fastMatch.tool, fastMatch.params);
      if (success) {
        this.setState('idle');
      } else {
        // O'xshamasa yoki kontekst bo'lmasa, back-endga yuboramiz
        this.sendToLLM(text);
      }
    } else {
      // LLM fallback
      this.sendToLLM(text);
    }
  }

  private sendToLLM(text: string) {
    if (!this.agentSocket) return;
    const state = this.options.getFrontendState();
    this.agentSocket.send(text, state);
  }

  private async handleToolCall(tool: string, params: any, speak?: string) {
    let success = false;
    
    // Tasdiqlash kerak bo'lgan asboblar
    if (this.DESTRUCTIVE_TOOLS.includes(tool)) {
      const confirmed = await this.options.requestConfirmation(tool, params);
      if (!confirmed) {
        this.setState('idle');
        return;
      }
    }

    success = await this.executeAction(tool, params);

    if (speak) {
      this.setState('speaking');
      await this.options.speak(speak);
    }
    
    this.setState('idle');
  }
  
  private async executeAction(tool: string, params: any): Promise<boolean> {
    if (this.FRONTEND_ONLY_TOOLS.includes(tool)) {
      return await this.options.executePlaybackAction(tool, params);
    } else {
      return await this.options.executeApiAction(tool, params);
    }
  }

  private async handleClarify(question: string) {
    this.setState('speaking');
    await this.options.speak(question);
    // Avtomat tarzda yana tinglashni boshlaymiz
    this.startListening();
  }

  private async handleError(msg: string) {
    console.error("Voice Error:", msg);
    this.setState('idle');
  }
}
