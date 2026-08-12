import { ENV } from '../config/env';

interface VoiceInputOptions {
  onListeningStart: () => void;
  onListeningStop: () => void;
  onSpeechDetected: () => void;
  onSpeechResult: (text: string) => void;
  onError: (error: string) => void;
}

export class VoiceInput {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  private isListening = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private readonly SILENCE_THRESHOLD = 20; // Amplitude (0-255)
  private readonly SILENCE_DURATION = 1500; // 1.5 seconds of silence before auto-stop

  private options: VoiceInputOptions;

  constructor(options: VoiceInputOptions) {
    this.options = options;
  }

  public async start() {
    if (this.isListening) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
      
      this.setupVAD(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        this.cleanup();
        
        // Agar yozuv juda qisqa bo'lsa
        if (audioBlob.size > 1000) {
           await this.transcribeAudio(audioBlob);
        }
      };

      this.mediaRecorder.start();
      this.isListening = true;
      this.options.onListeningStart();
      this.resetSilenceTimer();

    } catch (err) {
      console.error('Microphone access error:', err);
      this.options.onError('Mikrofonga ruxsat berilmadi.');
    }
  }

  public stop() {
    if (!this.isListening || !this.mediaRecorder) return;
    
    if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
    }
    
    this.isListening = false;
    this.options.onListeningStop();
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
  }

  private setupVAD(stream: MediaStream) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.microphone = this.audioContext.createMediaStreamSource(stream);
    
    this.analyser.fftSize = 256;
    this.microphone.connect(this.analyser);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudioLevel = () => {
      if (!this.isListening || !this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      if (average > this.SILENCE_THRESHOLD) {
        this.resetSilenceTimer();
        this.options.onSpeechDetected();
      }
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, this.SILENCE_DURATION);
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  private async transcribeAudio(audioBlob: Blob) {
    if (!ENV.MOHIR_API_KEY) {
      console.warn("Mohir.ai API kodi kiritilmagan.");
      // this.options.onSpeechResult("play"); // for debugging
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.webm');
      
      // Mohir.ai API proxied via Next.js
      const res = await fetch('/mohir-api/v1/stt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.MOHIR_API_KEY}`
          // Do NOT set Content-Type here; browser sets it automatically with boundary for FormData
        },
        body: formData
      });
      
      if (!res.ok) {
        throw new Error(`STT API error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.text) {
        this.options.onSpeechResult(data.text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      this.options.onError("Ovozni aniqlashda xatolik yuz berdi.");
    }
  }
}
