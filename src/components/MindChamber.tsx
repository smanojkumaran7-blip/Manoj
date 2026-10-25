import React, { useState, useEffect, useRef } from 'react';
import { InteractionMessage, SynapticModule } from '../types.ts';
import {
  Send,
  Sparkles,
  Cpu,
  Split,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Zap,
  Globe,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plug,
  Play,
  ArrowRight,
  Brain,
  Radio,
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldAlert,
  Database,
  Bot,
} from 'lucide-react';
import { sound, voiceCoordinator } from '../utils/audio.ts';
import { SUPPORTED_LANGUAGES } from '../utils/initialState.ts';

interface MindChamberProps {
  messages: InteractionMessage[];
  currentGen: number;
  modules: SynapticModule[];
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onSendMessage: (
    text: string,
    compareBaseline: boolean,
    enableSearchGrounding: boolean,
    language: string
  ) => Promise<void>;
  onOpenVoiceModal: () => void;
  onOpenCapabilities?: () => void;
  onOpenSecurity?: () => void;
  onRequestOpenExternal?: (url: string, title: string, type: 'website' | 'app') => void;
  onSwitchTab?: (tab: 'matrix' | 'chamber' | 'vault' | 'lineage' | 'gauntlet' | 'plugins' | 'agent') => void;
  onTriggerEvolve?: () => void;
  onSaveToVault?: (msg: InteractionMessage) => void;
  isInfiniteConversation?: boolean;
  onToggleInfiniteConversation?: () => void;
  isLoading: boolean;
}

export const MindChamber: React.FC<MindChamberProps> = ({
  messages,
  currentGen,
  modules,
  selectedLanguage,
  onSelectLanguage,
  onSendMessage,
  onOpenVoiceModal,
  onOpenCapabilities,
  onOpenSecurity,
  onRequestOpenExternal,
  onSwitchTab,
  onTriggerEvolve,
  onSaveToVault,
  isInfiniteConversation = false,
  onToggleInfiniteConversation,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [compareBaseline, setCompareBaseline] = useState(true);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [micErrorReason, setMicErrorReason] = useState<string | null>(null);
  const [isRequestingMicDirect, setIsRequestingMicDirect] = useState(false);
  
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Play spoken response via Gemini TTS or browser synthesis with single agent lock
  const handleSpeakMessage = async (msgId: string, text: string) => {
    // If already playing this message, stop it
    if (speakingId === msgId) {
      voiceCoordinator.stopAllSpeech();
      audioPlayerRef.current = null;
      setSpeakingId(null);
      return;
    }

    // Stop existing playback across all agents
    voiceCoordinator.stopAllSpeech();
    audioPlayerRef.current = null;

    if (voiceCoordinator.isLiveSpeaking()) {
      // Do not interrupt Live voice stream
      return;
    }

    setSpeakingId(msgId);
    sound.playClick();

    const cleanText = text.replace(/\[.*?\]/g, '').replace(/https?:\/\/\S+/g, '').trim();

    try {
      // Call Gemini 3.8 Flash Lite TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName: 'Zephyr' }),
      });
      const data = await response.json();

      if (data.success && data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audioPlayerRef.current = audio;
        const played = voiceCoordinator.playAudioElement(audio, () => {
          setSpeakingId(null);
          audioPlayerRef.current = null;
        });
        if (played) return;
      }
    } catch {
      // fallback to browser speech synthesis
    }

    // Fallback: Web Speech API under Single Voice Coordinator
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 300));
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      voiceCoordinator.speakUtterance(utterance);
    } else {
      setSpeakingId(null);
    }
  };

  // Direct mic access request with clear feedback
  const handleDirectMicRequest = async () => {
    setIsRequestingMicDirect(true);
    sound.playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicErrorReason(null);
      sound.playUpgradeSuccess();
      // Start listening now that user allowed permission
      handleToggleSpeechRecognition();
    } catch (err: any) {
      console.warn('Direct mic permission request failed:', err);
      setMicErrorReason(
        'Microphone access blocked. Click the lock icon in your browser URL bar, set Microphone to Allow, then try again.'
      );
    } finally {
      setIsRequestingMicDirect(false);
    }
  };

  // Speech-to-Text Microphone using Web Speech API (zero window.alert)
  const handleToggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicErrorReason('Speech recognition is not supported in this browser. Please use the JARVIS Voice button or type below.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setMicErrorReason(null);

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      const langMap: Record<string, string> = {
        en: 'en-US',
        ta: 'ta-IN',
        hi: 'hi-IN',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        ja: 'ja-JP',
        zh: 'zh-CN',
        ar: 'ar-SA',
        ru: 'ru-RU',
        it: 'it-IT',
        pt: 'pt-BR',
      };
      recognition.lang = langMap[selectedLanguage] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicErrorReason(null);
        sound.playSynapticSpark();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicErrorReason('Microphone permission blocked in browser. Click "Grant Mic" to allow access or type your prompt.');
        } else if (event.error !== 'no-speech') {
          setMicErrorReason(`Microphone notice: ${event.error}. You can continue typing below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      setIsListening(false);
      setMicErrorReason('Unable to activate microphone. Please click "Grant Mic" or type your message.');
    }
  };

  // Auto-speak new assistant messages if enabled
  useEffect(() => {
    if (!autoSpeak || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant' && lastMsg.id !== speakingId) {
      handleSpeakMessage(lastMsg.id, lastMsg.text);
    }
  }, [messages, autoSpeak]);

  const sampleChallenges = [
    {
      title: '🎙️ Voice Navigation Guide',
      prompt:
        'Omni, explain how your voice navigation works. What wake phrases and website navigation commands can I use like "Hey Omni, open Instagram" or "Hey Omni, open YouTube"?',
    },
    {
      title: '⚡ What can you do for me?',
      prompt:
        'Omni, what can you do for me? Give me a comprehensive overview of your direct voice navigation, self-evolution engine, universal languages, Google Search grounding, and plugin integrations.',
    },
    {
      title: '🇮🇳 தமிழ்: என்ன செய்ய முடியும்?',
      prompt:
        'ஜார்விஸ், நீங்கள் எனக்கு என்னென்ன செய்ய முடியும்? உங்கள் குரல் உரையாடல், சுய-மேம்பாடு, மற்றும் அனைத்து அம்சங்களையும் தமிழில் முழுமையாக விவரிக்கவும்.',
    },
    {
      title: '🇮🇳 हिन्दी: क्या कर सकते हैं?',
      prompt:
        'जार्विस, आप मेरे लिए क्या-क्या कर सकते हैं? अपनी आवाज, स्वचालित विकास और सभी प्लगइन्स का विवरण दें।',
    },
    {
      title: '🇪🇸 Español: ¿Qué puedes hacer?',
      prompt:
        'Jarvis, ¿qué puedes hacer por mí? Detalla tu motor de auto-evolución, conversación por voz y complementos.',
    },
    {
      title: '🚪 4-Door Monty Hall Paradox',
      prompt:
        'Jarvis, in a 4-door Monty Hall problem with 1 car and 3 goats, you pick Door 1. The host opens Door 2 revealing a goat. Then a sudden earthquake opens Door 3 revealing another goat. What is the mathematically optimal choice between staying with Door 1 or switching to Door 4, and what are their exact probabilities?',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    sound.playClick();
    await onSendMessage(text, compareBaseline, enableSearchGrounding, selectedLanguage);
  };

  const handleSelectSample = (prompt: string) => {
    setInputText(prompt);
    sound.playClick();
  };

  const toggleThinking = (id: string) => {
    sound.playClick();
    setExpandedThinking((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to check if message describes capabilities or permissions
  const isCapabilitiesOrPermissionsQuery = (text: string) => {
    const lower = text.toLowerCase();
    return (
      lower.includes('what can you do') ||
      lower.includes('capabilities') ||
      lower.includes('what ai assistant can do') ||
      lower.includes('என்ன செய்ய முடியும்') ||
      lower.includes('क्या कर सकते') ||
      lower.includes('qué puedes hacer') ||
      lower.includes('subsystems') ||
      lower.includes('plugins') ||
      lower.includes('permission') ||
      lower.includes('open website') ||
      lower.includes('open app') ||
      lower.includes('allow')
    );
  };

  const handleOpenSourceLink = (e: React.MouseEvent, url: string, title: string) => {
    e.preventDefault();
    sound.playClick();
    if (onRequestOpenExternal) {
      onRequestOpenExternal(url, title, 'website');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Controls Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            COGNITIVE INTERACTION CHAMBER // GEN {currentGen}
          </h2>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                sound.playClick();
                onSelectLanguage(e.target.value);
              }}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-slate-100">
                  {l.flag} {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Live Voice Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenVoiceModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 transition shadow-sm"
            title="Start real-time voice conversation with Gemini 3.8 Live API"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>JARVIS Voice (Gemini 3.8 Live)</span>
          </button>

          {/* What Can Jarvis Do? Button */}
          {onOpenCapabilities && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenCapabilities();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-700/80 hover:bg-indigo-900/80 transition"
              title="View all capabilities J.A.R.V.I.S. offers"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Capabilities</span>
            </button>
          )}

          {/* Infinite Conversation Stream Mode Toggle */}
          {onToggleInfiniteConversation && (
            <button
              onClick={() => {
                sound.playClick();
                onToggleInfiniteConversation();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                isInfiniteConversation
                  ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400 animate-pulse'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-cyan-300 hover:border-slate-700'
              }`}
              title="Continuous infinite conversation stream: J.A.R.V.I.S. continues dialectic inquiries endlessly without token truncation"
            >
              <span>♾️</span>
              <span>{isInfiniteConversation ? 'Infinite Stream Active' : 'Infinite Stream'}</span>
            </button>
          )}

          {/* Agentic Mission Control Launcher */}
          {onSwitchTab && (
            <button
              onClick={() => {
                sound.playClick();
                onSwitchTab('agent');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-700/80 hover:bg-cyan-900/80 hover:border-cyan-500 transition shadow-sm"
              title="Open Autonomous Agent Mission Control"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agentic Tasks</span>
            </button>
          )}

          {/* Operator Permissions Button */}
          {onOpenSecurity && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenSecurity();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900/80 transition"
              title="View Security & Permission Gate"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permissions Gate</span>
            </button>
          )}

          {/* Google Search Grounding Toggle */}
          <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableSearchGrounding}
              onChange={(e) => setEnableSearchGrounding(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
            />
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Google Search</span>
          </label>

          {/* A/B Compare Toggle */}
          <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={compareBaseline}
              onChange={(e) => setCompareBaseline(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
            />
            <Split className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">Compare Baseline</span>
          </label>

          {/* Auto Speak Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setAutoSpeak(!autoSpeak);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border ${
              autoSpeak
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Automatically speak J.A.R.V.I.S. responses aloud"
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Speak Aloud</span>
          </button>
        </div>
      </div>

      {/* Infinite Conversation Active Banner */}
      {isInfiniteConversation && (
        <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border-b border-cyan-500/40 px-3.5 py-2 flex items-center justify-between text-xs font-mono shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-cyan-300 font-bold uppercase tracking-wider">
              ♾️ INFINITE CONVERSATION STREAM ENGAGED
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              • Context compression active across unlimited turns
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onSendMessage(
                'Deepen our philosophical deduction and formulate the next higher-order question.',
                compareBaseline,
                enableSearchGrounding,
                selectedLanguage
              );
            }}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
          >
            <span>Deepen Dialogue ➔</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/60 animate-pulse">
              <Brain className="w-8 h-8" />
            </div>

            <div className="max-w-md">
              <h3 className="text-base font-bold text-white font-mono flex items-center justify-center gap-2">
                <span>J.A.R.V.I.S. NEURAL CHAMBER</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  GEN {currentGen}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                At your service, Sir. Autonomous recursive cognition online. Ask in any language, test complex logical paradoxes, or test external permissions.
              </p>
            </div>

            {/* Quick Starter Cards */}
            <div className="w-full max-w-2xl text-left pt-2">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Recommended Inquiries:</span>
                <span className="text-slate-500 text-[10px]">Click any prompt to load</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleChallenges.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sc.prompt)}
                    className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/50 text-left transition group"
                  >
                    <div className="text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                      <span>{sc.title}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-sans">
                      {sc.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={`${msg.id}-${idx}`}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm text-white shadow-md">
                  <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                    <span>OPERATOR</span>
                    {msg.language && msg.language !== 'auto' && (
                      <span className="text-[9px] uppercase bg-slate-900 px-1.5 rounded text-cyan-400">
                        {msg.language}
                      </span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ) : (
                <div className="max-w-[95%] w-full space-y-3">
                  {/* Assistant Message Bubble */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-xl shadow-black/40">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-950 flex items-center justify-center border border-cyan-800">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            J.A.R.V.I.S. // GEN {msg.gen}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Save to Knowledge Vault Button */}
                        {onSaveToVault && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onSaveToVault(msg);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition border bg-slate-950/80 text-purple-400 border-slate-800 hover:border-purple-600 hover:bg-purple-950/30"
                            title="Commit this insight or summary to Knowledge Vault"
                          >
                            <Database className="w-3 h-3 text-purple-400" />
                            <span className="hidden sm:inline">Save to Vault</span>
                          </button>
                        )}

                        {/* Spoken Response Button ("Speak With Me") */}
                        <button
                          onClick={() => handleSpeakMessage(msg.id, msg.text)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition border ${
                            speakingId === msg.id
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold animate-pulse'
                              : 'bg-slate-950/80 text-cyan-400 border-slate-800 hover:border-cyan-600'
                          }`}
                          title="Speak this response aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{speakingId === msg.id ? 'Speaking...' : 'Speak'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Speech Execution Live Banner */}
                    {speakingId === msg.id && (
                      <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-cyan-950/50">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-cyan-300 animate-bounce" />
                          <span className="font-bold tracking-wider uppercase text-[11px]">
                            AI AGENT SPOKEN OUTPUT // ACTIVE EXECUTION
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <span
                              key={n}
                              className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse"
                              style={{ animationDelay: `${n * 120}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Modules & Vault Recall Tag Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      {msg.activeModulesUsed && msg.activeModulesUsed.length > 0 && (
                        <>
                          <span className="text-[10px] font-mono text-slate-400">
                            Active Directives:
                          </span>
                          {msg.activeModulesUsed.map((mName, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/60"
                            >
                              {mName}
                            </span>
                          ))}
                        </>
                      )}

                      {/* Knowledge Vault Memory Recall Badge */}
                      {(msg.text.includes('Knowledge Vault') ||
                        msg.text.includes('Vault Recall') ||
                        msg.internalThinking?.includes('Knowledge Vault')) && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/70 flex items-center gap-1">
                          <Database className="w-2.5 h-2.5 text-purple-400" />
                          <span>Vault Recall Active</span>
                        </span>
                      )}
                    </div>

                    {/* Metacognitive Reasoning Dropdown */}
                    {msg.internalThinking && (
                      <div className="mb-3 rounded-lg border border-amber-900/40 bg-amber-950/20 overflow-hidden">
                        <button
                          onClick={() => toggleThinking(msg.id)}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-mono font-medium text-amber-300 hover:bg-amber-950/30 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            Internal Metacognitive Trace & Module Audit
                          </span>
                          {expandedThinking[msg.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {expandedThinking[msg.id] && (
                          <div className="p-3 text-[11px] font-mono text-slate-300 bg-black/40 border-t border-slate-850 whitespace-pre-wrap leading-relaxed">
                            {msg.internalThinking}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Google Search Grounding Metadata Box - Guarded by Permission Gate */}
                    {msg.groundingMetadata && (
                      <div className="mb-3 bg-slate-950/90 border border-emerald-900/50 rounded-lg p-2.5 font-mono text-[11px]">
                        {msg.groundingMetadata.queries.length > 0 && (
                          <div className="mb-1.5 text-slate-400">
                            <span className="text-emerald-400 font-semibold">Web Searches Executed: </span>
                            {msg.groundingMetadata.queries.map((q, idx) => (
                              <span key={idx} className="inline-block bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300 mr-1.5 mb-1">
                                &ldquo;{q}&rdquo;
                              </span>
                            ))}
                          </div>
                        )}

                        {msg.groundingMetadata.sources.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-emerald-400 font-semibold">
                                Grounding Sources & Citations:
                              </span>
                              <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Requires Operator Permission to Open
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.groundingMetadata.sources.map((src, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => handleOpenSourceLink(e, src.url, src.title)}
                                  className="text-[10px] bg-slate-900 text-cyan-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-700 px-2 py-0.5 rounded flex items-center gap-1 transition"
                                  title="Click to request permission to open this source website"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span className="max-w-[200px] truncate">{src.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Evolved Response */}
                    <div className="text-sm font-sans text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Interactive Capabilities & Permissions Action Card */}
                    {isCapabilitiesOrPermissionsQuery(msg.text) && (
                      <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950/50 p-3 rounded-xl border border-cyan-900/40">
                        <div className="text-xs font-mono font-bold text-cyan-300 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>J.A.R.V.I.S. Interactive Subsystem Launchpad:</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Operator Consent Active
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <button
                            onClick={() => {
                              sound.playClick();
                              onOpenVoiceModal();
                            }}
                            className="p-2 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800 text-left text-xs font-mono text-cyan-300 flex items-center gap-2 transition"
                          >
                            <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>1. Talk Live</span>
                          </button>

                          <button
                            onClick={() => {
                              sound.playClick();
                              if (onTriggerEvolve) onTriggerEvolve();
                              else if (onSwitchTab) onSwitchTab('matrix');
                            }}
                            className="p-2 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-left text-xs font-mono text-amber-300 flex items-center gap-2 transition"
                          >
                            <Brain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>2. Self-Evolve</span>
                          </button>

                          <button
                            onClick={() => {
                              sound.playClick();
                              if (onSwitchTab) onSwitchTab('vault');
                            }}
                            className="p-2 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800 text-left text-xs font-mono text-purple-300 flex items-center gap-2 transition"
                          >
                            <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>3. Knowledge Vault</span>
                          </button>

                          <button
                            onClick={() => {
                              sound.playClick();
                              if (onSwitchTab) onSwitchTab('plugins');
                            }}
                            className="p-2 rounded bg-pink-950/60 hover:bg-pink-900/80 border border-pink-800 text-left text-xs font-mono text-pink-300 flex items-center gap-2 transition"
                          >
                            <Plug className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                            <span>4. Plugins Hub</span>
                          </button>

                          <button
                            onClick={() => {
                              sound.playClick();
                              if (onOpenSecurity) onOpenSecurity();
                              else if (onSwitchTab) onSwitchTab('gauntlet');
                            }}
                            className="p-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-left text-xs font-mono text-emerald-300 flex items-center gap-2 transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>5. Permissions Gate</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Baseline Gen 0 Comparison Card */}
                  {msg.baselineComparison && (
                    <div className="bg-slate-950/80 border border-dashed border-slate-800 rounded-xl p-3.5 text-xs font-sans text-slate-400">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 font-mono text-slate-400 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          <span>BASELINE GEN 0 (Without Self-Evolved Heuristics)</span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-400/80 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/40">
                          Un-Upgraded Surface Logic
                        </span>
                      </div>

                      <p className="text-slate-300 mb-2 whitespace-pre-wrap bg-slate-900/40 p-2.5 rounded border border-slate-850">
                        {msg.baselineComparison.gen0Text}
                      </p>

                      <div className="bg-indigo-950/30 border border-indigo-900/40 rounded p-2 text-[11px] font-mono text-indigo-300 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-indigo-200">Cognitive Upgrade Delta: </strong>
                          {msg.baselineComparison.contrastSummary}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-cyan-500/20 rounded-xl text-cyan-400 font-mono text-xs animate-pulse">
            <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Gen {currentGen} Synaptic Core deliberating, searching Google grounding data & cross-verifying proof invariants...</span>
          </div>
        )}
      </div>

      {/* Microphone Diagnostic Banner if blocked */}
      {micErrorReason && (
        <div className="mx-3 mb-1 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/70 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200 text-[11px] font-mono">{micErrorReason}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDirectMicRequest}
              disabled={isRequestingMicDirect}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-bold flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isRequestingMicDirect ? 'animate-spin' : ''}`} />
              <span>Grant Mic</span>
            </button>
            <button
              type="button"
              onClick={() => setMicErrorReason(null)}
              className="p-1 rounded text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input Form with Speech-to-Text Microphone */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        {/* Speech Recognition Mic Button */}
        <button
          type="button"
          onClick={handleToggleSpeechRecognition}
          className={`p-2.5 rounded-lg border transition flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/50'
              : 'bg-slate-950 text-slate-400 border-slate-700/80 hover:text-cyan-400 hover:border-cyan-500'
          }`}
          title={isListening ? 'Listening to speech... Click to stop' : 'Click to speak your message'}
        >
          {isListening ? <Mic className="w-4 h-4 text-rose-400 animate-bounce" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isListening
              ? 'Listening to your voice... speak now...'
              : `Ask Jarvis anything, say "what can you do for me?", or speak in ${
                  SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || 'any language'
                }...`
          }
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-sans"
        />

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/20 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Engage</span>
        </button>
      </form>
    </div>
  );
};
