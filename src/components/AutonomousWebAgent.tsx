import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Music,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  Bot,
  Terminal,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  Send,
  Mic,
  MicOff,
  Maximize2,
  Share2,
  Compass,
  ArrowRight,
  RefreshCw,
  Radio,
  Sliders,
  Check,
  Disc,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

export interface AutonomousStep {
  step: string;
  label: string;
  detail: string;
  timestamp: number;
}

export interface AutonomousSearchSource {
  title: string;
  snippet: string;
  url: string;
}

export interface AutonomousExecutionResult {
  actionType: 'music' | 'search' | 'website';
  command: string;
  title?: string;
  artist?: string;
  query?: string;
  videoId?: string;
  watchUrl?: string;
  searchUrl?: string;
  embedUrl?: string;
  spokenText?: string;
  spokenResult?: string;
  writtenSummary?: string;
  keyFacts?: string[];
  sources?: AutonomousSearchSource[];
  googleSearchUrl?: string;
  siteName?: string;
  url?: string;
  latencyMs?: number;
  steps?: AutonomousStep[];
}

interface AutonomousWebAgentProps {
  onDirectNavigate?: (url: string, title: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  className?: string;
  defaultCommand?: string;
}

export const AutonomousWebAgent: React.FC<AutonomousWebAgentProps> = ({
  onDirectNavigate,
  showToast,
  className = '',
  defaultCommand = '',
}) => {
  // Command & Execution state
  const [commandInput, setCommandInput] = useState<string>(defaultCommand);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<AutonomousExecutionResult | null>(null);
  const [history, setHistory] = useState<AutonomousExecutionResult[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // Speech & Vocalization state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(true);

  // Audio / Music Player controls
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [useFallbackSynth, setUseFallbackSynth] = useState<boolean>(false);

  // Fallback Audio Synthesizer ref (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Dictation state
  const [isListeningForCommand, setIsListeningForCommand] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Vocalize spoken text using Web Speech API or server TTS
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!autoSpeakEnabled || !textToSpeak || typeof window === 'undefined') return;

      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = speechRate;
          utterance.pitch = 1.0;
          utterance.lang = 'en-US';

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);

          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.warn('[Autonomous Vocalizer] Speech synthesis note:', err);
        setIsSpeaking(false);
      }
    },
    [autoSpeakEnabled, speechRate]
  );

  // Stop any active speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Web Audio Fallback Ambient Synth Beat (starts if user wants direct guaranteed local sound)
  const startFallbackSynth = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play pleasant chord progression
      const chords = [
        [220.0, 261.63, 329.63], // Am
        [174.61, 220.0, 261.63], // F
        [261.63, 329.63, 392.0], // C
        [196.0, 246.94, 293.66], // G
      ];
      let chordIdx = 0;

      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = setInterval(() => {
        if (!isPlayingAudio || isMuted) return;
        const currentChord = chords[chordIdx % chords.length];
        chordIdx++;

        currentChord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.01 * (volume / 100), ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.06 * (volume / 100), ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 1.25);
        });
      }, 1400);
      setUseFallbackSynth(true);
    } catch {}
  }, [isPlayingAudio, isMuted, volume]);

  const stopFallbackSynth = useCallback(() => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    setUseFallbackSynth(false);
  }, []);

  // Main Autonomous Action Dispatcher
  const executeAutonomousAction = async (commandToRun?: string) => {
    const targetCommand = (commandToRun || commandInput).trim();
    if (!targetCommand) {
      showToast?.('Please enter a command (e.g. "go open youtube and play the song believer")', 'error');
      return;
    }

    sound.playSynapticSpark();
    setIsRunning(true);
    stopSpeech();
    setCurrentStepIndex(0);
    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] AUTONOMOUS DIRECTIVE RECEIVED: "${targetCommand}"`,
      `[${new Date().toLocaleTimeString()}] INITIATING MULTIMODAL AUTONOMOUS PIPELINE...`,
    ]);

    try {
      const response = await fetch('/api/autonomous/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: targetCommand,
          sayResult: true,
        }),
      });

      const data: AutonomousExecutionResult = await response.json();

      if (data && data.actionType) {
        setActiveResult(data);
        setHistory((prev) => [data, ...prev.slice(0, 7)]);

        // Animate execution logs
        if (data.steps && data.steps.length > 0) {
          data.steps.forEach((st, idx) => {
            setTimeout(() => {
              setCurrentStepIndex(idx + 1);
              setExecutionLogs((prevLogs) => [
                ...prevLogs,
                `[${new Date(st.timestamp).toLocaleTimeString()}] ${st.label}: ${st.detail}`,
              ]);
            }, (idx + 1) * 200);
          });
        }

        // Handle Audio / Spoken Output
        const spokenText = data.spokenResult || data.spokenText;
        if (spokenText) {
          setTimeout(() => {
            speakText(spokenText);
          }, 450);
        }

        // Handle Music Auto-Play
        if (data.actionType === 'music') {
          setIsPlayingAudio(true);
          sound.playUpgradeSuccess();
          showToast?.(`Autonomous YouTube: Now playing "${data.title}"`, 'success');
        } else if (data.actionType === 'search') {
          sound.playUpgradeSuccess();
          showToast?.(`Autonomous Search completed for "${data.query}"`, 'success');
        } else if (data.actionType === 'website') {
          sound.playClick();
          showToast?.(`Navigated to ${data.siteName}`, 'info');
          if (data.url && onDirectNavigate) {
            onDirectNavigate(data.url, data.siteName || 'Website');
          }
        }
      } else {
        throw new Error('Autonomous response invalid');
      }
    } catch (err: unknown) {
      console.error('[Autonomous Execution Failed]:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ERROR: Autonomous dispatch encountered an issue: ${errMsg}`,
      ]);
      showToast?.('Autonomous execution encountered an issue. Using fallback runner.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Toggle Voice Dictation for the command bar
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast?.('Speech recognition not supported in this browser.', 'error');
      return;
    }

    if (isListeningForCommand) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningForCommand(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningForCommand(true);
        sound.playSynapticSpark();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setCommandInput(transcript);

        if (event.results[0].isFinal) {
          setIsListeningForCommand(false);
          // Auto execute after short pause
          setTimeout(() => {
            executeAutonomousAction(transcript);
          }, 400);
        }
      };

      recognition.onerror = () => {
        setIsListeningForCommand(false);
      };

      recognition.onend = () => {
        setIsListeningForCommand(false);
      };

      recognition.start();
    } catch {
      setIsListeningForCommand(false);
    }
  };

  // Preset Commands
  const PRESET_COMMANDS = [
    {
      label: 'Open YouTube & Play Believer',
      cmd: 'go open youtube and play the song believer',
      type: 'music',
      icon: <Music className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      label: 'Play Shape of You on YouTube',
      cmd: 'go open youtube and play shape of you',
      type: 'music',
      icon: <Music className="w-3.5 h-3.5 text-pink-400" />,
    },
    {
      label: 'Play Interstellar Theme',
      cmd: 'go open youtube and play interstellar theme',
      type: 'music',
      icon: <Disc className="w-3.5 h-3.5 text-purple-400" />,
    },
    {
      label: 'Play Lofi Chill Beats',
      cmd: 'go open youtube and play lofi chill beats',
      type: 'music',
      icon: <Radio className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      label: 'Search CEO of Google & Say Result',
      cmd: 'go search who is the CEO of Google and say the result',
      type: 'search',
      icon: <Search className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      label: 'Search Latest AI News & Say Result',
      cmd: 'go search latest artificial intelligence breakthroughs and say the result',
      type: 'search',
      icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      label: 'Search Quantum Computing & Say Result',
      cmd: 'use any website go search quantum computing progress and say the result',
      type: 'search',
      icon: <Sparkles className="w-3.5 h-3.5 text-teal-400" />,
    },
  ];

  // Auto-run if defaultCommand is provided
  useEffect(() => {
    if (defaultCommand) {
      executeAutonomousAction(defaultCommand);
    }
    return () => {
      stopSpeech();
      stopFallbackSynth();
    };
  }, []);

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Top Banner / Autonomous Command Input Center */}
      <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Bot className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-white tracking-wide uppercase">
                  Autonomous Web Agent &amp; Media Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>AUTONOMOUS ACTIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute live web searches with spoken vocalization and play songs on YouTube autonomously.
              </p>
            </div>
          </div>

          {/* Quick Voice & Audio Settings */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition ${
                autoSpeakEnabled
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle automatic spoken result vocalization"
            >
              {autoSpeakEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Say Result: {autoSpeakEnabled ? 'ON' : 'MUTED'}</span>
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeech}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-600/70 text-xs font-mono font-bold flex items-center gap-1 animate-pulse"
              >
                <span>Stop Voice</span>
              </button>
            )}
          </div>
        </div>

        {/* Command Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeAutonomousAction();
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="e.g. 'go open youtube and play the song believer' or 'go search who is the CEO of Google and say the result'"
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-mono transition pl-10 pr-12"
            />
            <Terminal className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />

            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-3 top-2.5 p-1.5 rounded-lg transition ${
                isListeningForCommand
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title="Dictate autonomous command with voice"
            >
              {isListeningForCommand ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isRunning || !commandInput.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/60 disabled:opacity-50 transition shrink-0"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Run Autonomously</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Quick-Action Chips */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Autonomous Presets:</span>
          </span>

          {PRESET_COMMANDS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCommandInput(item.cmd);
                executeAutonomousAction(item.cmd);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 text-[11px] font-mono shrink-0 transition"
            >
              {item.icon}
              <span>&ldquo;{item.label}&rdquo;</span>
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE AUTONOMOUS RESULTS VIEWPORT */}
      {activeResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-3">
          {/* 1. YOUTUBE MUSIC & AUDIO PLAYER CARD */}
          {activeResult.actionType === 'music' && (
            <div className="bg-gradient-to-br from-indigo-950/90 via-slate-950 to-purple-950/90 border border-indigo-500/50 rounded-2xl p-4 shadow-2xl relative overflow-hidden space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900/80 border border-indigo-400/50 flex items-center justify-center shadow-lg shadow-indigo-950">
                    <Music className="w-5 h-5 text-indigo-300 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold tracking-wider flex items-center gap-1.5">
                      <span>YOUTUBE AUTONOMOUS MEDIA STREAM</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </span>
                    <h3 className="text-sm sm:text-base font-mono font-bold text-white">
                      {activeResult.title || activeResult.query}
                    </h3>
                    <p className="text-xs text-indigo-300/80 font-mono">
                      Artist: {activeResult.artist || 'Official Track'} • YouTube Video ID: [
                      {activeResult.videoId || 'LIVE'}]
                    </p>
                  </div>
                </div>

                {/* Player Controls & External Launch */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!useFallbackSynth) {
                        startFallbackSynth();
                      } else {
                        stopFallbackSynth();
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
                      useFallbackSynth
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                    title="Toggle local synthesized audio backup stream"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Synth Backup: {useFallbackSynth ? 'PLAYING' : 'OFF'}</span>
                  </button>

                  <a
                    href={activeResult.watchUrl || activeResult.searchUrl || 'https://www.youtube.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-red-950"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Embedded YouTube Player Iframe */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 rounded-xl overflow-hidden border border-indigo-800/60 bg-black aspect-video max-h-80 w-full relative group">
                  {activeResult.videoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${activeResult.videoId}?autoplay=1&enablejsapi=1`}
                      title={activeResult.title || 'YouTube Player'}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <Music className="w-12 h-12 text-indigo-400 mb-2 animate-pulse" />
                      <p className="font-mono text-xs">Audio Stream Initialized</p>
                    </div>
                  )}
                </div>

                {/* Spoken Voice Confirmation & Playback Deck */}
                <div className="bg-slate-900/90 border border-indigo-900/50 rounded-xl p-3.5 flex flex-col justify-between space-y-3 font-mono">
                  <div>
                    <div className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider mb-1 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Spoken Confirmation
                    </div>
                    <p className="text-xs text-slate-200 italic bg-indigo-950/50 border border-indigo-800/40 rounded-lg p-2.5">
                      &ldquo;{activeResult.spokenText}&rdquo;
                    </p>
                  </div>

                  {/* Audio Controls */}
                  <div className="space-y-2 border-t border-slate-800 pt-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Playback Status:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        ACTIVE
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(activeResult.spokenText || '')}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Replay Voice</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Latency: <span className="text-cyan-400 font-bold">{activeResult.latencyMs || 12}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. LIVE WEB SEARCH & "SAY THE RESULT" VIEWPORT */}
          {activeResult.actionType === 'search' && (
            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-950 to-cyan-950/80 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl relative overflow-hidden space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-950">
                    <Search className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                      <span>LIVE WEB SEARCH &amp; SAY RESULT ENGINE</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </span>
                    <h3 className="text-sm sm:text-base font-mono font-bold text-white">
                      Search Query: &ldquo;{activeResult.query}&rdquo;
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeResult.googleSearchUrl || `https://www.google.com/search?q=${encodeURIComponent(activeResult.query || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-950"
                  >
                    <span>View Search Engine</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* VOCALIZED RESULT SPOTLIGHT BOX (The core "Say the Result" requirement!) */}
              <div className="bg-slate-900/95 border-2 border-emerald-400/70 rounded-xl p-4 shadow-xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400 text-slate-950 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      <span>SPOKEN RESULT VOCALIZATION</span>
                    </span>
                    {isSpeaking && (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Speaking now...
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => speakText(activeResult.spokenResult || activeResult.spokenText || '')}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak Result Again</span>
                  </button>
                </div>

                <p className="text-sm sm:text-base font-sans font-medium text-slate-100 leading-relaxed bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/40">
                  {activeResult.spokenResult || activeResult.spokenText}
                </p>

                {activeResult.writtenSummary && (
                  <div className="text-xs text-slate-300 font-sans border-t border-slate-800 pt-2">
                    <span className="font-mono text-emerald-400 uppercase text-[10px] font-bold block mb-0.5">
                      Executive Context Summary:
                    </span>
                    {activeResult.writtenSummary}
                  </div>
                )}
              </div>

              {/* Key Facts & Authoritative Sources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Key Facts */}
                {activeResult.keyFacts && activeResult.keyFacts.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <h4 className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extracted Knowledge Points</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {activeResult.keyFacts.map((fact, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Web Sources */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Authoritative Web Sources ({activeResult.sources?.length || 0})</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {activeResult.sources?.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 p-2 rounded-lg transition group"
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200 group-hover:text-emerald-300">
                          <span className="truncate max-w-[200px]">{src.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 font-sans">
                          {src.snippet}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. WEBSITE NAVIGATION CARD */}
          {activeResult.actionType === 'website' && (
            <div className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    DESTINATION READY
                  </span>
                  <h3 className="text-sm font-mono font-bold text-white">
                    {activeResult.siteName || 'External Website'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                    {activeResult.url}
                  </p>
                </div>
              </div>

              <a
                href={activeResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-950"
              >
                <span>Launch {activeResult.siteName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* AUTONOMOUS EXECUTION TRACE LOG */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-slate-200">AUTONOMOUS AUDIT TRACE</span>
              </div>
              <span className="text-slate-500">Latency: {activeResult.latencyMs || 50}ms</span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar font-mono text-[11px]">
              {executionLogs.map((log, lIdx) => (
                <div key={lIdx} className="text-cyan-300/90 leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
