export class TTS {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isEnabled: boolean = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initVoice();
  }

  private initVoice() {
    // Brauzer ovozlarini yuklashni kutamiz (ba'zan asinxron bo'ladi)
    const setVoice = () => {
      const voices = this.synth.getVoices();
      // O'zbek yoki Rus ovozini qidiramiz, topilmasa standart ovoz
      this.voice = 
        voices.find(v => v.lang.startsWith('uz')) || 
        voices.find(v => v.lang.startsWith('ru')) || 
        voices[0] || null;
    };

    if (this.synth.getVoices().length > 0) {
      setVoice();
    } else {
      this.synth.onvoiceschanged = setVoice;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isEnabled || !text) {
        resolve();
        return;
      }

      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      // O'zbekcha o'qish uchun sozlamalar (agar rus tili bo'lsa)
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error("TTS xatosi:", e);
        this.currentUtterance = null;
        resolve();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  public cancel() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
}

// Singleton instance to prevent overlapping speech
export const ttsService = typeof window !== 'undefined' ? new TTS() : null;
