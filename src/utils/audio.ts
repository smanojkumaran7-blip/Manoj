// Synthetic audio effects using Web Audio API

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play quick pulse click
  playClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // AudioContext fallback
    }
  }

  // Play diagnostic scan sound
  playScan() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // silent
    }
  }

  // Play synaptic spark
  playSynapticSpark() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // silent
    }
  }

  // Play upgrade celebratory chord
  playUpgradeSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.07, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });
    } catch {
      // silent
    }
  }

  // Play low error tone
  playError() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // silent
    }
  }
}

// Single Unified Voice Coordinator: Enforces strictly ONE voice agent speaking at any time
class SingleVoiceCoordinator {
  private activeSpeaker: 'none' | 'jarvis_live' | 'speech_synth' | 'audio_element' = 'none';
  private currentAudio: HTMLAudioElement | null = null;
  private listeners: Set<(speaker: string) => void> = new Set();

  public stopAllSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    this.activeSpeaker = 'none';
    this.notify();
  }

  public registerLiveSpeaking(speaking: boolean) {
    if (speaking) {
      // Live API is actively speaking: immediately silence all other sources!
      this.stopAllSpeech();
      this.activeSpeaker = 'jarvis_live';
    } else if (this.activeSpeaker === 'jarvis_live') {
      this.activeSpeaker = 'none';
    }
    this.notify();
  }

  public isLiveSpeaking(): boolean {
    return this.activeSpeaker === 'jarvis_live';
  }

  public playAudioElement(audio: HTMLAudioElement, onEnded?: () => void): boolean {
    if (this.activeSpeaker === 'jarvis_live') {
      // Block overlapping audio if Live API is talking
      return false;
    }
    this.stopAllSpeech();
    this.activeSpeaker = 'audio_element';
    this.currentAudio = audio;
    this.notify();

    const cleanup = () => {
      if (this.currentAudio === audio) {
        this.currentAudio = null;
        this.activeSpeaker = 'none';
        this.notify();
      }
      onEnded?.();
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    audio.play().catch(() => {
      cleanup();
    });
    return true;
  }

  public speakUtterance(utterance: SpeechSynthesisUtterance): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    if (this.activeSpeaker === 'jarvis_live') {
      // Do not interrupt Live voice stream
      return false;
    }
    this.stopAllSpeech();
    this.activeSpeaker = 'speech_synth';
    this.notify();

    const originalEnd = utterance.onend;
    const originalError = utterance.onerror;

    utterance.onend = (e) => {
      if (this.activeSpeaker === 'speech_synth') {
        this.activeSpeaker = 'none';
        this.notify();
      }
      originalEnd?.call(utterance, e);
    };

    utterance.onerror = (e) => {
      if (this.activeSpeaker === 'speech_synth') {
        this.activeSpeaker = 'none';
        this.notify();
      }
      originalError?.call(utterance, e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public getSpeaker(): string {
    return this.activeSpeaker;
  }

  public subscribe(cb: (speaker: string) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.activeSpeaker);
      } catch {}
    });
  }
}

export const sound = new SoundEngine();
export const voiceCoordinator = new SingleVoiceCoordinator();
