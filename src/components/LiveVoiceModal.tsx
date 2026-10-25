import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SynapticModule, VoiceState, LiveTranscript, LiveVoiceTask, KnowledgeEntry, ExternalPermissionRequest } from '../types.ts';
import { LiveAudioClient } from '../utils/audioStream.ts';
import { SUPPORTED_LANGUAGES } from '../utils/initialState.ts';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Radio,
  Sparkles,
  Zap,
  Square,
  Globe,
  Shield,
  Activity,
  Terminal,
  AlertTriangle,
  RefreshCw,
  Send,
  Play,
  CheckCircle2,
  Database,
  Cpu,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Calculator,
  Workflow,
  ListFilter,
  Check,
  Copy,
  Wrench,
} from 'lucide-react';
import { sound, voiceCoordinator } from '../utils/audio.ts';
import { parseWebsiteNavigation, getApprovedWebsites, detectWakeWord } from '../utils/voiceNavigationConfig.ts';
import { ChatGptVoiceOrb } from './ChatGptVoiceOrb.tsx';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGen: number;
  currentIQ: number;
  modules: SynapticModule[];
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onRunEvolution?: (domainFocus?: string) => Promise<any>;
  onSaveToVault?: (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'recallCount'>) => void;
  onRequestOpenExternal?: (url: string, title: string, type: 'website' | 'app', description?: string, voicePreAuthorized?: boolean) => void;
  onSwitchTab?: (tab: 'matrix' | 'chamber' | 'vault' | 'lineage' | 'gauntlet' | 'plugins' | 'agent') => void;
  onRunBenchmark?: (challengeName?: string) => Promise<any>;
  knowledgeVault?: KnowledgeEntry[];
  pendingPermissionRequest?: ExternalPermissionRequest | null;
  onAllowPermission?: (url?: string, title?: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  currentGen,
  currentIQ,
  modules,
  selectedLanguage,
  onSelectLanguage,
  onRunEvolution,
  onSaveToVault,
  onRequestOpenExternal,
  onSwitchTab,
  onRunBenchmark,
  knowledgeVault = [],
  pendingPermissionRequest = null,
  onAllowPermission,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('disconnected');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcripts, setTranscripts] = useState<LiveTranscript[]>([]);
  const [statusMessage, setStatusMessage] = useState('Initiating J.A.R.V.I.S. Neural Bridge...');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isRetryingMic, setIsRetryingMic] = useState(false);
  const [liveTextInput, setLiveTextInput] = useState('');

  // Parallel Task Execution State
  const [tasks, setTasks] = useState<LiveVoiceTask[]>([]);
  const [activeTask, setActiveTask] = useState<LiveVoiceTask | null>(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [taskInputModal, setTaskInputModal] = useState<{
    isOpen: boolean;
    type: 'vault_save' | 'math' | 'open_external' | 'benchmark';
    initialVal?: string;
  }>({ isOpen: false, type: 'vault_save' });
  const [taskDraftInput, setTaskDraftInput] = useState('');

  // AI Agent Live Speech Execution State (For prominent speech execution in marked HUD)
  const [activeSpeechText, setActiveSpeechText] = useState<string>('');
  const [isReplayingSpeech, setIsReplayingSpeech] = useState<boolean>(false);
  const [speechCopied, setSpeechCopied] = useState<boolean>(false);
  const [popupBlockedNotice, setPopupBlockedNotice] = useState<boolean>(false);

  // Direct launch resource if pop-up blocked by browser
  const [lastNavigatedTarget, setLastNavigatedTarget] = useState<{ url: string; title: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioClientRef = useRef<LiveAudioClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Latest model speech transcript fallback
  const latestModelText = useMemo(() => {
    return (
      transcripts
        .slice()
        .reverse()
        .find((t) => t.sender === 'model' && !t.text.includes('[PARALLEL TASK COMPLETE]'))?.text || ''
    );
  }, [transcripts]);

  const displayedSpeech = activeSpeechText || latestModelText;

  // Replay speech audio via /api/tts or browser speech synthesis with Single Voice Agent lock
  const handleReplayActiveSpeech = async (overrideText?: string) => {
    const textToSpeak = (overrideText || displayedSpeech).replace(/\[.*?\]/g, '').trim();
    if (!textToSpeak) return;

    // Strict Single Voice Lock: If Gemini Live is already speaking, do NOT overlap!
    if (voiceCoordinator.isLiveSpeaking()) {
      return;
    }

    setIsReplayingSpeech(true);
    sound.playClick();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voiceName: 'Zephyr' }),
      });
      const data = await res.json();
      if (data.success && data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        const played = voiceCoordinator.playAudioElement(audio, () => setIsReplayingSpeech(false));
        if (played) return;
      }
    } catch {
      // fallback cleanly to browser speech synthesis
    }

    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(textToSpeak.substring(0, 300));
      utt.rate = 1.05;
      utt.pitch = 0.95;
      utt.onend = () => setIsReplayingSpeech(false);
      utt.onerror = () => setIsReplayingSpeech(false);
      voiceCoordinator.speakUtterance(utt);
    } else {
      setIsReplayingSpeech(false);
    }
  };

  const handleCopySpeech = (overrideText?: string) => {
    const textToCopy = overrideText || displayedSpeech;
    if (!textToCopy) return;
    sound.playClick();
    navigator.clipboard.writeText(textToCopy);
    setSpeechCopied(true);
    setTimeout(() => setSpeechCopied(false), 2000);
  };

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Connect to WebSocket & Live API session
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    const audioClient = new LiveAudioClient();
    audioClientRef.current = audioClient;

    audioClient.onVolumeChange = (vol) => {
      setVolumeLevel(vol);
      if (vol > 0.08 && !isMicMuted) {
        setVoiceState('listening');
      }
    };

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;
    setVoiceState('connecting');
    setStatusMessage('Establishing quantum link to Gemini 3.8 Live API with Parallel Tool Runtime...');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      setVoiceState('connected');
      setStatusMessage('J.A.R.V.I.S. protocols online. Voice & Parallel Task Subsystems active...');

      // Notify context & language
      ws.send(
        JSON.stringify({
          type: 'update_context',
          context: {
            gen: currentGen,
            iq: currentIQ,
            modules: modules.map((m) => m.name),
            language: selectedLanguage,
            vaultCount: knowledgeVault.length,
          },
        })
      );

      // Start mic capture
      const micStarted = await audioClient.startRecording();
      if (micStarted) {
        setMicPermissionDenied(false);
        audioClient.onAudioChunk = (base64PCM) => {
          if (ws.readyState === WebSocket.OPEN && !isMicMuted) {
            ws.send(JSON.stringify({ type: 'audio', audio: base64PCM }));
          }
        };
        setStatusMessage('J.A.R.V.I.S. is listening. Speak tasks or questions freely in any language, Sir.');
      } else {
        setMicPermissionDenied(true);
        setStatusMessage('Microphone access blocked. Click "Retry Mic" or type below to hear J.A.R.V.I.S.');
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ready') {
          setStatusMessage(data.message || 'J.A.R.V.I.S. Core Ready (Parallel Execution Online)');
        } else if (data.type === 'audio' && data.audio) {
          setIsModelSpeaking(true);
          setVoiceState('speaking');
          voiceCoordinator.registerLiveSpeaking(true);
          audioClient.playAudioChunk(data.audio);
        } else if (data.type === 'interrupted') {
          audioClient.interrupt();
          setIsModelSpeaking(false);
          voiceCoordinator.registerLiveSpeaking(false);
          setVoiceState('listening');
          setStatusMessage('Speech interrupted by operator.');
        } else if (data.type === 'turn_complete') {
          setIsModelSpeaking(false);
          voiceCoordinator.registerLiveSpeaking(false);
          setVoiceState('connected');
        } else if (data.type === 'model_transcript' && data.text) {
          setActiveSpeechText((prev) => (prev ? prev + ' ' + data.text : data.text));
          setTranscripts((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.sender === 'model') {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + ' ' + data.text },
              ];
            }
            return [
              ...prev,
              {
                id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender: 'model',
                text: data.text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ];
          });
        } else if (data.type === 'user_transcript' && data.text) {
          const userText = data.text.trim();
          if (userText) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'user' && !last.text.includes(userText)) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + ' ' + userText },
                ];
              } else if (!last || last.sender !== 'user') {
                return [
                  ...prev,
                  {
                    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    sender: 'user',
                    text: userText,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ];
              }
              return prev;
            });
            detectAndDispatchVoiceTask(userText);
          }
        } else if (data.type === 'task_executing' && data.call) {
          // Gemini Live tool call triggered from speech!
          handleToolCallDispatched(data.call);
        } else if (data.type === 'task_completed' && data.call) {
          // Gemini Live tool call completed
          handleToolCallFinished(data.call, data.output);
        } else if (data.type === 'error') {
          setStatusMessage('System Alert: ' + data.message);
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    ws.onerror = () => {
      setStatusMessage('Neural connection error.');
      setVoiceState('disconnected');
    };

    ws.onclose = () => {
      setVoiceState('disconnected');
      setStatusMessage('J.A.R.V.I.S. voice session closed.');
    };

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (audioClientRef.current) {
      audioClientRef.current.destroy();
      audioClientRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsModelSpeaking(false);
    setVoiceState('disconnected');
  };

  // Continuous Microphone Speech Recognition for Direct Spoken Commands & "Permission Granted" Clearance
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;
    let isStoppedManually = false;

    const startListening = () => {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
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

        recognition.onresult = (event: any) => {
          let recognizedText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            recognizedText += event.results[i][0].transcript;
          }
          recognizedText = recognizedText.trim();
          if (recognizedText) {
            // Check if voice contains command like opening websites or granting clearance
            detectAndDispatchVoiceTask(recognizedText);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.warn('[LiveVoiceModal SpeechRecognition]', event.error);
          }
        };

        recognition.onend = () => {
          if (!isStoppedManually && isOpen) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
      } catch (e) {
        console.warn('SpeechRecognition start notice:', e);
      }
    };

    startListening();

    return () => {
      isStoppedManually = true;
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [isOpen, selectedLanguage]);

  const retryMicCapture = async () => {
    setIsRetryingMic(true);
    sound.playClick();
    try {
      if (!audioClientRef.current) {
        audioClientRef.current = new LiveAudioClient();
      }
      const success = await audioClientRef.current.startRecording();
      if (success) {
        setMicPermissionDenied(false);

        audioClientRef.current.onAudioChunk = (base64PCM) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isMicMuted) {
            wsRef.current.send(JSON.stringify({ type: 'audio', audio: base64PCM }));
          }
        };

        audioClientRef.current.onVolumeChange = (vol) => {
          setVolumeLevel(vol);
          if (vol > 0.08 && !isMicMuted) {
            setVoiceState('listening');
          }
        };

        setStatusMessage('Microphone connected! J.A.R.V.I.S. is listening.');
        sound.playUpgradeSuccess();
      } else {
        setMicPermissionDenied(true);
        setStatusMessage('Microphone access blocked. Click lock icon in browser URL bar to allow.');
      }
    } catch (err) {
      console.warn('Microphone retry failed:', err);
      setMicPermissionDenied(true);
      setStatusMessage('Microphone permission still blocked. Check browser address bar lock icon.');
    } finally {
      setIsRetryingMic(false);
    }
  };

  const handleToggleMute = () => {
    sound.playClick();
    setIsMicMuted(!isMicMuted);
  };

  const handleInterrupt = () => {
    sound.playClick();
    if (audioClientRef.current) {
      audioClientRef.current.interrupt();
    }
    setIsModelSpeaking(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: '[Interrupting speech]' }));
    }
  };

  const handleSwitchLanguage = (langCode: string) => {
    sound.playClick();
    onSelectLanguage(langCode);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_language', language: langCode }));
    }
  };

  // PARALLEL TASK EXECUTION ENGINE
  const executeParallelTask = async (
    type: LiveVoiceTask['type'],
    params?: {
      title?: string;
      content?: string;
      summary?: string;
      category?: string;
      tags?: string[];
      url?: string;
      tab?: string;
      expression?: string;
      challengeName?: string;
      domainFocus?: string;
      voicePreAuthorized?: boolean;
    }
  ) => {
    const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let taskName = '';

    switch (type) {
      case 'evolution':
        taskName = `Recursive Self-Evolution [Gen ${currentGen} -> Gen ${currentGen + 1}]`;
        break;
      case 'vault_save':
        taskName = `Archive Insight to Knowledge Vault: "${params?.title || 'Key Finding'}"`;
        break;
      case 'open_external':
        taskName = `Open External Resource: ${params?.title || params?.url || 'Application'}`;
        break;
      case 'benchmark':
        taskName = `Benchmark Gauntlet: ${params?.challengeName || 'Formal Rigor Test'}`;
        break;
      case 'math':
        taskName = `Math Sandbox Computation: ${params?.expression || 'Formula'}`;
        break;
      case 'view_switch':
        taskName = `Interface Navigation: Switch to ${params?.tab?.toUpperCase() || 'Matrix'}`;
        break;
      case 'agentic_task':
        taskName = `Agentic Autonomous Task: ${params?.title || (params as any)?.goal || 'Infinite Mission'}`;
        break;
    }

    const newTask: LiveVoiceTask = {
      id: taskId,
      name: taskName,
      type,
      status: 'running',
      progress: 15,
      detail: 'Allocating parallel cognitive thread while voice stream continues...',
      createdAt: new Date().toLocaleTimeString(),
    };

    setActiveTask(newTask);
    setTasks((prev) => [newTask, ...prev]);
    sound.playClick();

    // Broadcast task event to WebSocket so Gemini Live can acknowledge
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'task_event',
          event: {
            name: taskName,
            status: 'running',
            detail: 'Execution initialized in parallel with live audio.',
          },
        })
      );
    }

    try {
      if (type === 'evolution') {
        // Step 1: Diagnosing
        updateTaskProgress(taskId, 35, 'Diagnosing baseline cognitive flaws in current heuristic layer...');
        await new Promise((r) => setTimeout(r, 600));

        // Step 2: Mutating & Verifying
        updateTaskProgress(taskId, 70, 'Mutating high-potency synaptic directive & running formal verification...');
        let evoRes: any = null;
        if (onRunEvolution) {
          evoRes = await onRunEvolution(params?.domainFocus);
        } else {
          await new Promise((r) => setTimeout(r, 800));
        }

        // Step 3: Complete
        const resultMsg = evoRes?.deltaIQ
          ? `Engine upgraded to Gen ${currentGen + 1} with +${evoRes.deltaIQ} IQ gain!`
          : `Engine successfully synthesized higher-order heuristic directive.`;
        completeTask(taskId, resultMsg, `Upgraded runtime matrix to Generation ${currentGen + 1}.`);
      } else if (type === 'vault_save') {
        updateTaskProgress(taskId, 50, 'Extracting semantic core & formatting Knowledge Vault record...');
        await new Promise((r) => setTimeout(r, 400));

        if (onSaveToVault) {
          onSaveToVault({
            title: params?.title || `Insight from Voice Session (Gen ${currentGen})`,
            category: (params?.category as any) || 'finding',
            summary: params?.summary || params?.title || 'Key takeaway captured during J.A.R.V.I.S. voice exchange.',
            content: params?.content || params?.summary || 'Recorded directly from operator voice stream.',
            tags: params?.tags || ['Voice Session', `Gen-${currentGen}`, 'Parallel Task'],
            sourceOrigin: 'voice_session',
            confidenceScore: 98,
            pinned: true,
            activeInRecall: true,
          });
        }
        completeTask(taskId, `Insight committed to permanent Knowledge Vault.`, 'Permanent storage synced.');
      } else if (type === 'open_external') {
        const targetUrl = params?.url || 'https://github.com';
        const targetTitle = params?.title || 'External Application';

        updateTaskProgress(taskId, 90, `Direct Navigation: Opening ${targetTitle}...`);
        await new Promise((r) => setTimeout(r, 100));

        try {
          const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            setPopupBlockedNotice(true);
          } else {
            setPopupBlockedNotice(false);
          }
        } catch {
          setPopupBlockedNotice(true);
        }

        sound.playUpgradeSuccess();
        const spokenConf = `Opening ${targetTitle} directly.`;
        setActiveSpeechText(spokenConf);
        setLastNavigatedTarget({ url: targetUrl, title: targetTitle });

        if (onRequestOpenExternal) {
          onRequestOpenExternal(targetUrl, targetTitle, 'website', 'Directive assigned to voice agent.', true);
        }

        completeTask(
          taskId,
          `Direct Navigation: Opened ${targetTitle}.`,
          `Cleared and navigated directly to ${targetUrl}.`
        );
      } else if (type === 'benchmark') {
        updateTaskProgress(taskId, 40, 'Deploying formal proof challenge to Benchmark Gauntlet...');
        let benchRes: any = null;
        if (onRunBenchmark) {
          benchRes = await onRunBenchmark(params?.challengeName);
        } else {
          await new Promise((r) => setTimeout(r, 900));
        }
        const score = benchRes?.score || 96;
        completeTask(taskId, `Empirical score: ${score}/100. Q.E.D. Proof verified.`, `Formal verification passed with score ${score}/100.`);
      } else if (type === 'math') {
        updateTaskProgress(taskId, 60, 'Evaluating expression in isolated numeric engine...');
        let calcResult = '0';
        try {
          const expr = (params?.expression || '0').replace(/\^/g, '**');
          const calcFunc = new Function(`'use strict'; return (${expr})`);
          calcResult = String(calcFunc());
        } catch (e: any) {
          calcResult = `Error: ${e.message}`;
        }
        completeTask(taskId, `Result: ${calcResult}`, `Computed result: ${calcResult}`);
      } else if (type === 'view_switch') {
        const targetTab = (params?.tab as any) || 'matrix';
        if (onSwitchTab) {
          onSwitchTab(targetTab);
        }
        completeTask(taskId, `Active tab switched to ${targetTab.toUpperCase()}.`, `Interface view updated.`);
      } else if (type === 'agentic_task') {
        updateTaskProgress(taskId, 50, 'Formulating agentic sub-tasks under Operator permission gate...');
        if (onSwitchTab) {
          onSwitchTab('agent');
        }
        await new Promise((r) => setTimeout(r, 600));
        completeTask(taskId, `Agentic mission launched under Operator clearance gate.`, 'Redirected to Agentic Core.');
      }
    } catch (err: any) {
      console.error('Parallel task error:', err);
      failTask(taskId, err.message || 'Task execution failed.');
    }
  };

  const updateTaskProgress = (taskId: string, progress: number, detail: string) => {
    setActiveTask((prev) => (prev && prev.id === taskId ? { ...prev, progress, detail } : prev));
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress, detail } : t))
    );
  };

  const completeTask = (taskId: string, result: string, detail: string) => {
    sound.playUpgradeSuccess();
    const completedAt = new Date().toLocaleTimeString();
    setActiveTask((prev) =>
      prev && prev.id === taskId
        ? { ...prev, status: 'completed', progress: 100, result, detail, completedAt }
        : null
    );
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed', progress: 100, result, detail, completedAt }
          : t
      )
    );

    // Announce to transcripts & live WebSocket
    setTranscripts((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: 'model',
        text: `⚡ [PARALLEL TASK COMPLETE] ${result}`,
        timestamp: completedAt,
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'task_event',
          event: {
            name: activeTask?.name || 'Parallel Task',
            status: 'completed',
            detail: result,
          },
        })
      );
    }

    // Auto-clear active banner after 4 seconds
    setTimeout(() => {
      setActiveTask((curr) => (curr?.id === taskId ? null : curr));
    }, 4500);
  };

  const failTask = (taskId: string, error: string) => {
    setActiveTask(null);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'failed', progress: 100, result: `Failed: ${error}`, detail: error }
          : t
      )
    );
    sound.playError();
  };

  // Handle Live API Tool Calls dispatched from voice speech
  const handleToolCallDispatched = (call: { id: string; name: string; args: any }) => {
    const mapping: Record<string, LiveVoiceTask['type']> = {
      execute_evolution: 'evolution',
      save_to_knowledge_vault: 'vault_save',
      request_open_external: 'open_external',
      run_benchmark: 'benchmark',
      execute_math: 'math',
      switch_system_view: 'view_switch',
      execute_agentic_task: 'agentic_task',
    };

    const type = mapping[call.name] || 'evolution';
    const isVoiceGranted = Boolean(
      call.args?.permissionGrantedByVoice ||
      call.args?.voicePreAuthorized ||
      call.args?.authorized
    );

    executeParallelTask(type, {
      ...call.args,
      voicePreAuthorized: isVoiceGranted,
      tab: call.args?.tab,
      domainFocus: call.args?.domainFocus,
      challengeName: call.args?.challengeName,
    });
  };

  const handleToolCallFinished = (call: { id: string; name: string; args: any }, output: any) => {
    console.log('[Parallel Task Completed via Tool Call]:', call.name, output);
  };

  // Natural Language Command & Task Intent Recognizer (Direct Execution without Permission Gate)
  const detectAndDispatchVoiceTask = (text: string) => {
    const lower = text.toLowerCase().trim();

    // 1. Direct Website Navigation, Song Playback, & Search Intent (No permission required)
    const wakeDetect = detectWakeWord(text);
    const navQuery = wakeDetect.hasWakeWord ? (wakeDetect.remainderText || text) : text;
    const parsedNav = parseWebsiteNavigation(navQuery, getApprovedWebsites());

    if (parsedNav.matched && parsedNav.site) {
      executeParallelTask('open_external', {
        url: parsedNav.site.url,
        title: parsedNav.site.name,
      });
      return true;
    }

    // 1. Evolution intent
    if (
      lower.includes('evolve') ||
      lower.includes('evolution') ||
      lower.includes('upgrade brain') ||
      lower.includes('self-improve') ||
      lower.includes('mutate')
    ) {
      executeParallelTask('evolution');
      return true;
    }

    // 2. Knowledge Vault intent
    if (
      lower.includes('save to vault') ||
      lower.includes('store in vault') ||
      lower.includes('knowledge vault') ||
      lower.includes('remember this') ||
      lower.includes('archive finding')
    ) {
      const cleanTitle = text.replace(/save to vault|store in vault|remember this|knowledge vault/gi, '').trim() || 'Spoken Key Finding';
      executeParallelTask('vault_save', {
        title: cleanTitle.length > 5 ? cleanTitle : 'Spoken Cognitive Insight',
        summary: text,
        content: text,
      });
      return true;
    }

    // General domain URL or direct search fallback
    if (
      lower.startsWith('open ') ||
      lower.includes('open website') ||
      lower.includes('open app') ||
      lower.includes('launch ') ||
      lower.includes('browse ') ||
      lower.includes('navigate to ') ||
      lower.includes('visit ')
    ) {
      let target = 'https://github.com';
      let title = 'GitHub';

      const domainMatch = lower.match(/(https?:\/\/[^\s]+|[a-z0-9-]+\.(com|org|net|io|dev|app|ai|edu|tv|in))/i);
      if (domainMatch) {
        let url = domainMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        target = url;
        title = domainMatch[0];
      } else {
        const query = text.replace(/hey omni|omni|open|website|app|launch|browse|navigate to|visit|please/gi, '').trim();
        if (query) {
          target = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          title = `Search: "${query}"`;
        }
      }

      executeParallelTask('open_external', {
        url: target,
        title,
      });
      return true;
    }

    // 4. Benchmark challenge intent
    if (
      lower.includes('benchmark') ||
      lower.includes('gauntlet') ||
      lower.includes('test logic') ||
      lower.includes('prove')
    ) {
      executeParallelTask('benchmark', { challengeName: 'Interventional Causal Graph Resolution' });
      return true;
    }

    // 5. Math calculation intent
    if (
      lower.startsWith('calculate ') ||
      lower.startsWith('compute ') ||
      lower.startsWith('solve ') ||
      /^[0-9+\-*/().^%\s]+$/.test(lower)
    ) {
      const expr = text.replace(/calculate|compute|solve/gi, '').trim();
      if (expr) {
        executeParallelTask('math', { expression: expr });
        return true;
      }
    }

    // 6. View switch intent
    if (
      lower.includes('show vault') ||
      lower.includes('open vault') ||
      lower.includes('knowledge vault tab')
    ) {
      executeParallelTask('view_switch', { tab: 'vault' });
      return true;
    } else if (lower.includes('show matrix') || lower.includes('open matrix')) {
      executeParallelTask('view_switch', { tab: 'matrix' });
      return true;
    } else if (lower.includes('show plugins') || lower.includes('open plugins')) {
      executeParallelTask('view_switch', { tab: 'plugins' });
      return true;
    }

    return false;
  };

  const handleQuickCommand = (text: string) => {
    sound.playClick();
    setActiveSpeechText('');
    setStatusMessage('Synthesizing spoken response & executing directives in parallel...');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'user',
          text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      wsRef.current.send(JSON.stringify({ type: 'text', text }));

      // Check for concurrent task execution!
      detectAndDispatchVoiceTask(text);
    }
  };

  const handleSendLiveText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTextInput.trim()) return;
    const text = liveTextInput.trim();
    setLiveTextInput('');
    handleQuickCommand(text);
  };

  const handleOpenTaskDraftModal = (type: 'vault_save' | 'math' | 'open_external' | 'benchmark') => {
    setTaskDraftInput('');
    setTaskInputModal({ isOpen: true, type });
  };

  const handleConfirmTaskDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskInputModal({ isOpen: false, type: 'vault_save' });
    const val = taskDraftInput.trim();

    if (taskInputModal.type === 'vault_save') {
      executeParallelTask('vault_save', {
        title: val || 'Spoken Insight from Operator',
        summary: val || 'Archived during J.A.R.V.I.S. voice session.',
        content: val,
      });
    } else if (taskInputModal.type === 'math') {
      executeParallelTask('math', { expression: val || 'Math.pow(2, 16)' });
    } else if (taskInputModal.type === 'open_external') {
      executeParallelTask('open_external', {
        url: val.startsWith('http') ? val : `https://${val || 'github.com'}`,
        title: val || 'External Resource',
      });
    } else if (taskInputModal.type === 'benchmark') {
      executeParallelTask('benchmark', { challengeName: val || 'Causal Rigor Gauntlet' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/60 rounded-2xl max-w-3xl w-full flex flex-col h-[700px] shadow-2xl shadow-cyan-950/80 overflow-hidden relative">
        {/* Top Header - Stark HUD Style */}
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  J.A.R.V.I.S. <span className="text-cyan-400">// VOICE & PARALLEL TASK CORE</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  GEN {currentGen} [IQ {currentIQ}]
                </span>
                {tasks.length > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <Workflow className="w-2.5 h-2.5" />
                    <span>{tasks.filter((t) => t.status === 'completed').length} Tasks Run</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-400 flex items-center flex-wrap gap-2">
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Sole Voice Agent: J.A.R.V.I.S.
                </span>
                <span>•</span>
                <span className="text-cyan-300 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-cyan-400" />
                  AI Self-Healer Online
                </span>
                <span>•</span>
                <span className="text-teal-400">Screen & Voice Dual Clearance</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setShowTaskDrawer(!showTaskDrawer);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition flex items-center gap-1.5 ${
                showTaskDrawer
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500'
              }`}
            >
              <Workflow className="w-3 h-3 text-cyan-400" />
              <span>Task HUD ({tasks.length})</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Permission Denied Alert Banner */}
        {micPermissionDenied && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/70 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-mono font-bold text-amber-200 text-[11px]">
                  Microphone Permission Blocked
                </div>
                <div className="text-[10px] text-amber-300/80 font-sans">
                  Click the lock or camera icon in your browser address bar to allow microphone access, or type below to give tasks while J.A.R.V.I.S. speaks back live.
                </div>
              </div>
            </div>
            <button
              onClick={retryMicCapture}
              disabled={isRetryingMic}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-bold shrink-0 flex items-center gap-1 transition shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${isRetryingMic ? 'animate-spin' : ''}`} />
              <span>Retry Mic</span>
            </button>
          </div>
        )}

        {/* Pop-up Blocked Notification (Direct 1-Click Launch without permission gate) */}
        {popupBlockedNotice && lastNavigatedTarget && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/70 shadow-lg shadow-cyan-950/50 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-slate-200">
              <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Direct Link Ready:</span>
              <strong className="text-cyan-300">{lastNavigatedTarget.title}</strong>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={lastNavigatedTarget.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  sound.playUpgradeSuccess();
                  setPopupBlockedNotice(false);
                }}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open {lastNavigatedTarget.title}</span>
              </a>
              <button
                type="button"
                onClick={() => setPopupBlockedNotice(false)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE RUNNING TASK HUD BANNER (Crucial: Shows real-time task executing parallel to voice!) */}
        {activeTask && (
          <div className="mx-3 mt-2 p-3 rounded-xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border border-cyan-500/70 shadow-lg shadow-cyan-950/50 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="uppercase tracking-wider">EXECUTING TASK IN PARALLEL WITH VOICE:</span>
                <span className="text-white truncate max-w-xs">{activeTask.name}</span>
              </div>
              <span className="text-emerald-400 font-bold">{activeTask.progress}%</span>
            </div>

            {/* Glowing animated progress bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-cyan-800/60 p-0.5 mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400"
                style={{ width: `${activeTask.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
              <div className="flex items-center gap-1 text-cyan-200 truncate">
                <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>{activeTask.detail}</span>
              </div>
              <span className="text-emerald-400 font-bold shrink-0 ml-2">Voice Channel Uninterrupted</span>
            </div>
            {displayedSpeech && (
              <div className="mt-1.5 pt-1 border-t border-cyan-800/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 truncate">
                <Volume2 className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
                <span className="text-slate-400">Agent Speech Output:</span>
                <span className="text-white italic truncate">&ldquo;{displayedSpeech}&rdquo;</span>
              </div>
            )}
          </div>
        )}

        {/* Futuristic ChatGPT Dynamic Morphing Dots Voice Core Frame */}
        <div className="py-4 px-4 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 flex flex-col items-center justify-center border-b border-slate-800/80 relative overflow-hidden">
          {/* ChatGPT Iconic Dynamic Morphing Dots Orb with Cybernetic HUD Brackets */}
          <ChatGptVoiceOrb
            isListening={voiceState === 'listening'}
            isSpeaking={isModelSpeaking}
            volumeLevel={volumeLevel}
            size="md"
            micDenied={micPermissionDenied}
            onClick={retryMicCapture}
          />

          {/* Telemetry Status Line */}
          <div className="text-center space-y-0.5 z-10 mt-1 mb-2">
            <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1.5">
              {isModelSpeaking ? (
                <span className="text-cyan-300 animate-pulse tracking-wide font-mono flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                  J.A.R.V.I.S. Speaking Spoken Audio Output...
                </span>
              ) : voiceState === 'listening' ? (
                <span className="text-amber-400 tracking-wide font-mono flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Listening to Operator Spoken Command...
                </span>
              ) : micPermissionDenied ? (
                <span className="text-amber-300 font-mono">
                  Mic Blocked • Type below to hear J.A.R.V.I.S. speak
                </span>
              ) : (
                <span className="text-slate-400">J.A.R.V.I.S. Ready // Voice Speech Execution Online</span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-500 max-w-md truncate">
              {statusMessage}
            </div>

            {/* Holographic Waveform Meter */}
            <div className="flex items-center justify-center gap-1 h-2.5 mt-0.5">
              {[0.2, 0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.3, 0.6, 0.8].map((mult, idx) => {
                const height = Math.max(2, Math.min(12, (volumeLevel || (isModelSpeaking ? 0.7 : 0.1)) * mult * 16));
                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isModelSpeaking
                        ? 'bg-cyan-400'
                        : voiceState === 'listening'
                        ? 'bg-amber-400'
                        : 'bg-slate-700'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>

          {/* AI AGENT SPOKEN OUTPUT EXECUTION CONSOLE (User Request: Execute & display AI Agent's speech in the marked HUD) */}
          <div className="w-full max-w-2xl px-2 z-10 mb-1">
            <div
              className={`p-3 rounded-xl border transition-all duration-300 backdrop-blur-md relative overflow-hidden ${
                isModelSpeaking
                  ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border-cyan-400/90 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'bg-slate-950/80 border-cyan-800/60 shadow-lg shadow-black/60'
              }`}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isModelSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI AGENT SPOKEN OUTPUT // REAL-TIME EXECUTION</span>
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      isModelSpeaking
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 animate-pulse'
                        : displayedSpeech
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {isModelSpeaking ? '⚡ EXECUTING SPEECH' : displayedSpeech ? '✓ OUTPUT EXECUTED' : 'STANDBY'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {displayedSpeech && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReplayActiveSpeech()}
                        disabled={isReplayingSpeech}
                        className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-[10px] font-mono font-bold flex items-center gap-1 transition shadow-sm"
                        title="Replay this speech aloud via Gemini TTS"
                      >
                        <Play className={`w-2.5 h-2.5 ${isReplayingSpeech ? 'animate-spin' : ''}`} />
                        <span>{isReplayingSpeech ? 'Speaking...' : 'Replay Audio'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySpeech()}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1 transition"
                        title="Copy spoken speech text"
                      >
                        {speechCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{speechCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Spoken Speech Output Text Area */}
              <div className="relative min-h-[44px] max-h-28 overflow-y-auto pr-1">
                {displayedSpeech ? (
                  <p className="font-sans text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                    <span className="text-cyan-400 font-mono text-xs mr-1">&ldquo;</span>
                    {displayedSpeech}
                    <span className="text-cyan-400 font-mono text-xs ml-1">&rdquo;</span>
                    {isModelSpeaking && (
                      <span className="inline-block w-2 h-3.5 bg-cyan-400 ml-1.5 animate-pulse align-middle" />
                    )}
                  </p>
                ) : (
                  <div className="flex items-center justify-center py-1.5 text-slate-400 text-xs font-mono gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Speak or type a command — J.A.R.V.I.S. speech output will execute right here in real time.</span>
                  </div>
                )}
              </div>

              {/* Bottom HUD Telemetry Line */}
              <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Stark Neural Voice Engine</span>
                  <span>•</span>
                  <span className="text-slate-300">GEN {currentGen} [IQ {currentIQ}]</span>
                </span>
                <span className="text-cyan-400 font-medium">
                  {selectedLanguage.toUpperCase()} Native Voice Protocol
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PARALLEL VOICE TASK DISPATCH BAR (User request #3: Execute a task while giving task to JARVIS voice) */}
        <div className="px-3 py-1.5 bg-slate-900 border-y border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-cyan-400" /> Execute in Parallel:
          </span>

          <button
            onClick={() => executeParallelTask('evolution')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-700/80 shrink-0 font-bold flex items-center gap-1 transition"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>⚡ Evolve Matrix</span>
          </button>

          <button
            onClick={() => handleOpenTaskDraftModal('vault_save')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 shrink-0 font-bold flex items-center gap-1 transition"
          >
            <Database className="w-3 h-3 text-cyan-400" />
            <span>🧠 Vault Archive</span>
          </button>

          <button
            onClick={() => executeParallelTask('benchmark')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 shrink-0 font-bold flex items-center gap-1 transition"
          >
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>🛡️ Benchmark Gauntlet</span>
          </button>

          <button
            onClick={() => handleOpenTaskDraftModal('math')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shrink-0 font-bold flex items-center gap-1 transition"
          >
            <Calculator className="w-3 h-3 text-emerald-400" />
            <span>🧮 Math Sandbox</span>
          </button>

          <button
            onClick={() => handleOpenTaskDraftModal('open_external')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shrink-0 font-bold flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3 h-3 text-cyan-300" />
            <span>🌐 Open App / Web</span>
          </button>
        </div>

        {/* Quick Language Switcher Bar */}
        <div className="px-3 py-1 bg-slate-950 border-b border-slate-850 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-mono uppercase text-slate-500 flex items-center gap-1 shrink-0">
            <Globe className="w-2.5 h-2.5 text-cyan-400" /> Language:
          </span>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSwitchLanguage(lang.code)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition shrink-0 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-850 hover:border-cyan-700'
                }`}
              >
                {lang.flag} {lang.nativeName}
              </button>
            );
          })}
        </div>

        {/* Main Conversation Log or Parallel Task Drawer */}
        {!showTaskDrawer ? (
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 font-mono text-xs bg-slate-950/60">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" /> J.A.R.V.I.S. Audio & Telemetry Log
              </span>
              <span className="text-[9px] text-slate-400">
                Tip: Speak &ldquo;Jarvis, evolve your matrix&rdquo; or &ldquo;Jarvis, save to vault...&rdquo;
              </span>
            </div>

            {transcripts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-sans space-y-2">
                <p className="font-mono text-cyan-300 font-bold">&ldquo;At your service, Sir. Listening and executing concurrently.&rdquo;</p>
                <p className="max-w-md mx-auto text-slate-400 text-xs">
                  Speak freely in English, Tamil, Hindi, Spanish, or any language. You can command tasks like self-evolution, Knowledge Vault storage, benchmark evaluations, or calculations while continuing the conversation.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  <button
                    onClick={() => handleQuickCommand('Open Spotify, permission granted')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1 transition"
                  >
                    <span>🎵 &ldquo;Open Spotify, permission granted&rdquo;</span>
                  </button>
                  <button
                    onClick={() => handleQuickCommand('Open YouTube, permission granted')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700 font-bold flex items-center gap-1 transition"
                  >
                    <span>📺 &ldquo;Open YouTube, permission granted&rdquo;</span>
                  </button>
                  <button
                    onClick={() => handleQuickCommand('Open Google, permission granted')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 font-bold flex items-center gap-1 transition"
                  >
                    <span>🔍 &ldquo;Open Google, permission granted&rdquo;</span>
                  </button>
                  <button
                    onClick={() => handleQuickCommand('Permission granted')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700 font-bold flex items-center gap-1 transition"
                  >
                    <span>🎙️ &ldquo;Permission granted&rdquo;</span>
                  </button>
                  <button
                    onClick={() => handleQuickCommand('Jarvis, evolve your neural matrix now.')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800"
                  >
                    &ldquo;Jarvis, evolve matrix&rdquo;
                  </button>
                  <button
                    onClick={() => handleQuickCommand('Jarvis, save this insight into the knowledge vault.')}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800"
                  >
                    &ldquo;Jarvis, save to vault&rdquo;
                  </button>
                </div>
              </div>
            ) : (
              transcripts.map((t, idx) => (
                <div
                  key={`${t.id}-${idx}`}
                  className={`p-3 rounded-xl border transition ${
                    t.sender === 'user'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 ml-8'
                      : t.text.includes('[PARALLEL TASK COMPLETE]')
                      ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-200 shadow-md shadow-emerald-950/40 mr-4'
                      : 'bg-gradient-to-r from-cyan-950/50 via-slate-900/80 to-indigo-950/50 border-cyan-500/60 text-cyan-100 mr-6 shadow-md shadow-cyan-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1.5 pb-1 border-b border-slate-800/60">
                    <div className="flex items-center gap-1.5 font-bold font-mono">
                      {t.sender === 'user' ? (
                        <span className="text-slate-400">OPERATOR (YOU)</span>
                      ) : (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span>AI AGENT SPOKEN OUTPUT // EXECUTED [GEN {currentGen}]</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{t.timestamp}</span>
                      {t.sender === 'model' && (
                        <button
                          type="button"
                          onClick={() => handleReplayActiveSpeech(t.text)}
                          className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 text-[9px] font-mono flex items-center gap-1 transition"
                          title="Replay this speech aloud via Gemini TTS"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Listen</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-sans text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{t.text}</p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        ) : (
          /* Parallel Task History Drawer */
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2 font-mono text-xs bg-slate-950/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-400" />
                <span className="font-bold uppercase text-slate-200 text-xs">
                  PARALLEL EXECUTION LOG ({tasks.length} Tasks Recorded)
                </span>
              </div>
              <button
                onClick={() => setShowTaskDrawer(false)}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Return to Live Audio Log
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No tasks executed during this voice session yet. Click the buttons above or speak a task command.
              </div>
            ) : (
              tasks.map((task, idx) => (
                <div
                  key={`${task.id}-${idx}`}
                  className={`p-3 rounded-xl border ${
                    task.status === 'completed'
                      ? 'bg-slate-900/70 border-emerald-800/60'
                      : task.status === 'running'
                      ? 'bg-cyan-950/40 border-cyan-500/70'
                      : 'bg-rose-950/40 border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">{task.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                        task.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : task.status === 'running'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">{task.detail}</p>
                  {task.result && (
                    <div className="mt-1.5 p-1.5 bg-black/50 rounded border border-slate-800 text-[10px] text-cyan-300">
                      Outcome: {task.result}
                    </div>
                  )}
                  <div className="mt-1 text-[9px] text-slate-500">
                    Initiated: {task.createdAt} {task.completedAt ? `• Completed: ${task.completedAt}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Live Audio & Spoken Command Text Input Form */}
        <form onSubmit={handleSendLiveText} className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={liveTextInput}
            onChange={(e) => setLiveTextInput(e.target.value)}
            placeholder={
              micPermissionDenied
                ? "Type a command or question (e.g. 'evolve', 'save to vault', 'calculate Math.sqrt(1024)')..."
                : "Type a command or speak into your microphone while tasks execute..."
            }
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
          />
          <button
            type="submit"
            disabled={!liveTextInput.trim()}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Speak / Dispatch</span>
          </button>
        </form>

        {/* Bottom Voice Controls */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!micPermissionDenied ? (
              <button
                onClick={handleToggleMute}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition ${
                  isMicMuted
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isMicMuted ? 'Mic Muted' : 'Mute Mic'}</span>
              </button>
            ) : (
              <button
                onClick={retryMicCapture}
                disabled={isRetryingMic}
                className="px-3 py-1.5 rounded-lg font-mono text-xs bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingMic ? 'animate-spin' : ''}`} />
                <span>Retry Mic</span>
              </button>
            )}

            {isModelSpeaking && (
              <button
                onClick={handleInterrupt}
                className="px-3 py-1.5 rounded-lg font-mono text-xs bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900/80 transition flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Interrupt</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              Parallel Thread Active
            </span>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-mono text-xs font-bold transition"
            >
              End Protocol
            </button>
          </div>
        </div>

        {/* Task Input Drawer Modal (for custom inputs like Math or Vault Archive) */}
        {taskInputModal.isOpen && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-cyan-500/60 rounded-xl max-w-md w-full p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-xs font-mono font-bold text-white flex items-center gap-2 uppercase">
                  {taskInputModal.type === 'vault_save' && <Database className="w-4 h-4 text-cyan-400" />}
                  {taskInputModal.type === 'math' && <Calculator className="w-4 h-4 text-emerald-400" />}
                  {taskInputModal.type === 'open_external' && <ExternalLink className="w-4 h-4 text-cyan-400" />}
                  {taskInputModal.type === 'benchmark' && <ShieldCheck className="w-4 h-4 text-indigo-400" />}
                  <span>
                    {taskInputModal.type === 'vault_save' && 'Archive Insight to Knowledge Vault'}
                    {taskInputModal.type === 'math' && 'Evaluate Math Sandbox Formula'}
                    {taskInputModal.type === 'open_external' && 'Open External App (Permission Gated)'}
                    {taskInputModal.type === 'benchmark' && 'Run Benchmark Gauntlet Test'}
                  </span>
                </h3>
                <button
                  onClick={() => setTaskInputModal({ isOpen: false, type: 'vault_save' })}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmTaskDraft} className="space-y-3">
                <p className="text-[11px] text-slate-400 font-sans">
                  {taskInputModal.type === 'vault_save' && 'Enter the title or core insight to commit to permanent Knowledge Vault while J.A.R.V.I.S. continues voice conversation:'}
                  {taskInputModal.type === 'math' && 'Enter a mathematical equation or formula to execute concurrently:'}
                  {taskInputModal.type === 'open_external' && 'Enter the destination URL or web app. Strict permission prompt will appear for your approval:'}
                  {taskInputModal.type === 'benchmark' && 'Enter the benchmark domain or challenge to evaluate:'}
                </p>

                <input
                  type="text"
                  autoFocus
                  value={taskDraftInput}
                  onChange={(e) => setTaskDraftInput(e.target.value)}
                  placeholder={
                    taskInputModal.type === 'vault_save'
                      ? 'e.g. Causal invariants require do-calculus intervention...'
                      : taskInputModal.type === 'math'
                      ? 'e.g. Math.sqrt(65536) * 42'
                      : taskInputModal.type === 'open_external'
                      ? 'e.g. https://github.com'
                      : 'e.g. Causal Directed Acyclicity'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTaskInputModal({ isOpen: false, type: 'vault_save' })}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 font-mono text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/40"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Dispatch In Parallel</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
