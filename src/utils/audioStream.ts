// Client-side real-time audio capture (16kHz) and playback (24kHz) for Gemini Live API

export class LiveAudioClient {
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  public isRecording: boolean = false;
  public onAudioChunk: ((base64PCM: string) => void) | null = null;
  public onVolumeChange: ((vol: number) => void) | null = null;

  // Start capturing mic at 16kHz
  async startRecording(): Promise<boolean> {
    if (this.isRecording) return true;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.inputCtx = new AudioCtx({ sampleRate: 16000 });
      if (this.inputCtx.state === 'suspended') {
        await this.inputCtx.resume();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      console.warn('Microphone access not granted:', err?.message || err);
      return false;
    }

    const source = this.inputCtx.createMediaStreamSource(this.mediaStream);
    // 2048 sample frames (~128ms per chunk)
    this.scriptProcessor = this.inputCtx.createScriptProcessor(2048, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);

      // Calculate volume level for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      if (this.onVolumeChange) {
        this.onVolumeChange(Math.min(1, rms * 5));
      }

      // Convert float32 [-1, 1] to 16-bit PCM little endian
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Base64 encode raw PCM
      const buffer = pcm16.buffer;
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      if (this.onAudioChunk) {
        this.onAudioChunk(base64);
      }
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputCtx.destination);
    this.isRecording = true;
    return true;
  }

  // Stop capturing mic
  stopRecording(): void {
    this.isRecording = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close().catch(() => {});
      this.inputCtx = null;
    }
  }

  // Ensure output AudioContext is initialized for 24kHz playback
  private initOutputCtx(): AudioContext {
    if (!this.outputCtx || this.outputCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.outputCtx = new AudioCtx({ sampleRate: 24000 });
      this.nextPlayTime = this.outputCtx.currentTime;
    }
    if (this.outputCtx.state === 'suspended') {
      this.outputCtx.resume().catch(() => {});
    }
    return this.outputCtx;
  }

  // Play incoming raw 24kHz 16-bit PCM audio chunk
  playAudioChunk(base64PCM: string): void {
    try {
      const ctx = this.initOutputCtx();

      // Decode base64 to binary
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM -> Float32
      const numSamples = Math.floor(len / 2);
      const int16View = new Int16Array(bytes.buffer, 0, numSamples);
      const float32 = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        float32[i] = int16View[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
      };
    } catch (e) {
      console.warn('Error playing audio chunk:', e);
    }
  }

  // Cancel playback if model is interrupted
  interrupt(): void {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    this.activeSources = [];
    if (this.outputCtx) {
      this.nextPlayTime = this.outputCtx.currentTime;
    }
  }

  // Full teardown
  destroy(): void {
    this.stopRecording();
    this.interrupt();
    if (this.outputCtx) {
      this.outputCtx.close().catch(() => {});
      this.outputCtx = null;
    }
  }
}
