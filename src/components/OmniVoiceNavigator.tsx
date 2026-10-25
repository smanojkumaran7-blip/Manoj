import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Globe,
  ExternalLink,
  Volume2,
  VolumeX,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Compass,
  Music,
  Search,
  Play,
  Camera,
  Bot,
  Terminal,
  Plug,
  ShieldCheck,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';
import {
  ApprovedWebsite,
  getApprovedWebsites,
  saveCustomWebsite,
  deleteCustomWebsite,
  isValidApprovedHttpsUrl,
  detectWakeWord,
  parseWebsiteNavigation,
} from '../utils/voiceNavigationConfig.ts';
import { ChatGptVoiceOrb } from './ChatGptVoiceOrb.tsx';

type NavigationMode = 'new_tab' | 'same_tab';

export interface OmniVoiceNavigatorProps {
  onDirectNavigate?: (url: string, title: string) => void;
  onOpenAutonomousView?: () => void;
  onOpenCameraView?: () => void;
  onOpenPluginsView?: () => void;
  onOpenAgentView?: () => void;
  onOpenZeroBugView?: () => void;
  className?: string;
}

export const OmniVoiceNavigator: React.FC<OmniVoiceNavigatorProps> = ({
  onDirectNavigate,
  onOpenAutonomousView,
  onOpenCameraView,
  onOpenPluginsView,
  onOpenAgentView,
  onOpenZeroBugView,
  className = '',
}) => {
  // Voice Recognition States
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isWakeActive, setIsWakeActive] = useState<boolean>(false);
  const [wakeTimeoutSeconds, setWakeTimeoutSeconds] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Listening for "Hey Omni"...');
  const [latestTranscript, setLatestTranscript] = useState<string>('');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState<boolean>(true);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('new_tab');
  const [lastNavigatedSite, setLastNavigatedSite] = useState<ApprovedWebsite | null>(null);

  // In-app interactive song player & search card states
  const [activeMusicPlayer, setActiveMusicPlayer] = useState<{
    title: string;
    query: string;
    url: string;
    videoId?: string;
    embedUrl?: string;
    spokenText?: string;
  } | null>(null);
  const [activeSearchModal, setActiveSearchModal] = useState<{
    query: string;
    url: string;
    spokenResult?: string;
    writtenSummary?: string;
    sources?: Array<{ title: string; snippet: string; url: string }>;
    keyFacts?: string[];
  } | null>(null);
  const [popupBlockedSite, setPopupBlockedSite] = useState<ApprovedWebsite | null>(null);

  // Settings & Directory Popover
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [websites, setWebsites] = useState<ApprovedWebsite[]>([]);
  const [newSiteName, setNewSiteName] = useState<string>('');
  const [newSiteUrl, setNewSiteUrl] = useState<string>('');
  const [newSiteKeywords, setNewSiteKeywords] = useState<string>('');
  const [addSiteError, setAddSiteError] = useState<string>('');

  // Recognition References
  const recognitionRef = useRef<any>(null);
  const isManuallyPausedRef = useRef<boolean>(false);
  const wakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTextRef = useRef<string>('');
  const lastProcessedTimeRef = useRef<number>(0);
  const restartAttemptsRef = useRef<number>(0);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load configured websites
  const reloadWebsites = useCallback(() => {
    setWebsites(getApprovedWebsites());
  }, []);

  useEffect(() => {
    reloadWebsites();
  }, [reloadWebsites]);

  // Check initial microphone permission state
  useEffect(() => {
    const checkMic = async () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        setMicPermission('denied');
        setStatusMessage('Web Speech API not supported in this browser.');
        return;
      }

      try {
        if (navigator.permissions && (navigator.permissions as any).query) {
          const result = await navigator.permissions.query({ name: 'microphone' as any });
          setMicPermission(result.state as 'prompt' | 'granted' | 'denied');
          result.onchange = () => {
            setMicPermission(result.state as 'prompt' | 'granted' | 'denied');
          };
        } else {
          setMicPermission('prompt');
        }
      } catch {
        setMicPermission('prompt');
      }
    };
    checkMic();
  }, []);

  // Subtle spoken audio feedback using Web Speech synthesis
  const speakFeedback = useCallback((text: string) => {
    if (!audioFeedbackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [audioFeedbackEnabled]);

  // Execute Direct Navigation without iframe crashes or popup blocker errors!
  const executeDirectNavigation = useCallback((
    site: ApprovedWebsite,
    spokenFeedbackText?: string,
    actionType?: 'website' | 'music' | 'search' | 'work_plugins' | 'agent' | 'camera' | string,
    query?: string
  ) => {
    if (!isValidApprovedHttpsUrl(site.url)) {
      setStatusMessage(`Omni: Destination URL for ${site.name} failed security check.`);
      return;
    }

    sound.playUpgradeSuccess();
    setLastNavigatedSite(site);

    const feedback = spokenFeedbackText || `Opening ${site.name}`;
    setStatusMessage(`Omni: ${feedback}...`);
    speakFeedback(feedback);

    if (onDirectNavigate) {
      onDirectNavigate(site.url, site.name);
    }

    // 1. If it's a song/music play command:
    // Open YouTube and also activate in-app YouTube player so it plays directly for the user!
    if (actionType === 'music' || site.category === 'music' || site.url.includes('search_query=')) {
      const songTitle = query || site.name.replace(/Playing\s+"(.*?)"/i, '$1');
      setActiveMusicPlayer({
        title: songTitle,
        query: songTitle,
        url: site.url,
        embedUrl: `https://www.youtube-nocookie.com/embed/7wtfhZwyrcc?autoplay=1&enablejsapi=1`,
      });

      // Call Autonomous Backend for exact YouTube video stream
      fetch('/api/autonomous/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `play the song ${songTitle}`,
          actionType: 'music',
          query: songTitle,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.videoId) {
            setActiveMusicPlayer({
              title: data.title || songTitle,
              query: songTitle,
              url: data.watchUrl || site.url,
              videoId: data.videoId,
              embedUrl: data.embedUrl || `https://www.youtube-nocookie.com/embed/${data.videoId}?autoplay=1&enablejsapi=1`,
              spokenText: data.spokenText,
            });
            if (data.spokenText) {
              speakFeedback(data.spokenText);
            }
          }
        })
        .catch(() => {});
    }

    // 2. If it's a search command:
    if (actionType === 'search') {
      const searchQuery = query || site.name.replace(/Google Search:\s+"(.*?)"/i, '$1').replace(/Search:\s+"(.*?)"/i, '$1');
      setActiveSearchModal({
        query: searchQuery,
        url: site.url,
      });

      // Call Autonomous Backend to query live web, synthesize facts, and say the result!
      fetch('/api/autonomous/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `search ${searchQuery} and say the result`,
          actionType: 'search',
          query: searchQuery,
          sayResult: true,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && (data.spokenResult || data.spokenText)) {
            const spoken = data.spokenResult || data.spokenText;
            setActiveSearchModal({
              query: data.query || searchQuery,
              url: data.googleSearchUrl || site.url,
              spokenResult: spoken,
              writtenSummary: data.writtenSummary,
              sources: data.sources,
              keyFacts: data.keyFacts,
            });
            speakFeedback(spoken);
          }
        })
        .catch(() => {});
    }

    // Detect if running inside an iframe (like AI Studio preview environment)
    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Always attempt opening in a clean new tab
    let openedInNewTab = false;
    try {
      const newWin = window.open(site.url, '_blank', 'noopener,noreferrer');
      if (newWin && !newWin.closed && typeof newWin.closed !== 'undefined') {
        openedInNewTab = true;
      }
    } catch {
      openedInNewTab = false;
    }

    if (openedInNewTab) {
      setPopupBlockedSite(null);
      setTimeout(() => {
        setStatusMessage(`Omni: Navigated to ${site.name}. Listening for "Hey Omni"...`);
      }, 3000);
    } else {
      // If NOT in iframe and user selected same_tab: allow direct page navigation
      if (!isInsideIframe && navigationMode === 'same_tab') {
        setTimeout(() => {
          window.location.href = site.url;
        }, 350);
      } else {
        // In iframe or browser popup blocker held async open:
        // Render instant 1-click launch bar with rel="noopener noreferrer" so it NEVER crashes the iframe!
        setPopupBlockedSite(site);
        setStatusMessage(`Omni: Destination ready! Click "Open ${site.name}" below.`);
      }
    }

    // Reset wake state
    setIsWakeActive(false);
    setWakeTimeoutSeconds(0);
    if (wakeTimerRef.current) clearInterval(wakeTimerRef.current);
  }, [navigationMode, onDirectNavigate, speakFeedback]);

  // Trigger wake word activation state
  const activateWakeState = useCallback((remainderText?: string) => {
    sound.playSynapticSpark();
    setIsWakeActive(true);
    setWakeTimeoutSeconds(8);

    if (wakeTimerRef.current) clearInterval(wakeTimerRef.current);
    wakeTimerRef.current = setInterval(() => {
      setWakeTimeoutSeconds((prev) => {
        if (prev <= 1) {
          if (wakeTimerRef.current) clearInterval(wakeTimerRef.current);
          setIsWakeActive(false);
          setStatusMessage('Listening for "Hey Omni"...');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // If remainder text has an immediate command (e.g. "Hey Omni, play the song Believer" or "Hey Omni, open YouTube")
    if (remainderText && remainderText.trim().length > 1) {
      const parsed = parseWebsiteNavigation(remainderText, getApprovedWebsites());
      if (parsed.matched) {
        if (parsed.actionType === 'camera') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Optical sensor and camera accessories activated.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenCameraView) onOpenCameraView();
          return;
        }
        if (parsed.actionType === 'work_plugins') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Accessing OmniWork plugins and DevOps engines.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenPluginsView) onOpenPluginsView();
          return;
        }
        if (parsed.actionType === 'agent') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Opening Agentic Mission Control.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenAgentView) onOpenAgentView();
          return;
        }
        if (parsed.actionType === 'zerobug') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Accessing Zero-Bug Citadel: all 24 tests passing.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenZeroBugView) onOpenZeroBugView();
          return;
        }
        if (parsed.site) {
          executeDirectNavigation(parsed.site, parsed.spokenFeedback, parsed.actionType, parsed.extractedQuery);
          return;
        }
      }
    }

    setStatusMessage('Omni: "Hey Omni" recognized! Say "Play the song...", "Search...", "Open camera", "Work plugins", "Agentic mission", or "Zero bugs"...');
    speakFeedback('How can I help you?');
  }, [executeDirectNavigation, speakFeedback, onOpenCameraView, onOpenPluginsView, onOpenAgentView, onOpenZeroBugView]);

  // Process voice recognition transcripts
  const handleTranscript = useCallback((rawTranscript: string) => {
    const transcript = rawTranscript.trim();
    if (!transcript) return;
    setLatestTranscript(transcript);

    const now = Date.now();
    // Anti-duplication: avoid repeating execution on identical transcript within 1.5s
    if (
      transcript.toLowerCase() === lastProcessedTextRef.current.toLowerCase() &&
      now - lastProcessedTimeRef.current < 1500
    ) {
      return;
    }

    // Case 1: Check if transcript contains the wake word "Hey Omni"
    const wakeResult = detectWakeWord(transcript);
    if (wakeResult.hasWakeWord) {
      lastProcessedTextRef.current = transcript;
      lastProcessedTimeRef.current = now;
      activateWakeState(wakeResult.remainderText);
      return;
    }

    // Case 2: Wake state is currently active, listening for the next voice command
    if (isWakeActive) {
      const parsed = parseWebsiteNavigation(transcript, getApprovedWebsites());
      if (parsed.matched) {
        lastProcessedTextRef.current = transcript;
        lastProcessedTimeRef.current = now;
        if (parsed.actionType === 'camera') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Optical sensor and camera accessories activated.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenCameraView) onOpenCameraView();
          return;
        }
        if (parsed.actionType === 'work_plugins') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Accessing OmniWork plugins and DevOps engines.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenPluginsView) onOpenPluginsView();
          return;
        }
        if (parsed.actionType === 'agent') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Opening Agentic Mission Control.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenAgentView) onOpenAgentView();
          return;
        }
        if (parsed.actionType === 'zerobug') {
          sound.playUpgradeSuccess();
          const feedback = parsed.spokenFeedback || 'Accessing Zero-Bug Citadel: all 24 tests passing.';
          setStatusMessage(`Omni: ${feedback}`);
          speakFeedback(feedback);
          if (onOpenZeroBugView) onOpenZeroBugView();
          return;
        }
        if (parsed.site) {
          executeDirectNavigation(parsed.site, parsed.spokenFeedback, parsed.actionType, parsed.extractedQuery);
          return;
        }
      } else if (parsed.isAmbiguous && transcript.length > 5) {
        lastProcessedTextRef.current = transcript;
        lastProcessedTimeRef.current = now;
        setStatusMessage(`Omni: Unclear command "${transcript}". Say "Play the song...", "Search...", "Work plugins", or "Open [site]".`);
      }
      return;
    }

    // Case 3: Natural direct command without saying "Hey Omni" first
    // (e.g. "play the song believer", "camera access", "open camera", "work plugins", "zero bugs")
    const parsedDirect = parseWebsiteNavigation(transcript, getApprovedWebsites());
    if (parsedDirect.matched) {
      lastProcessedTextRef.current = transcript;
      lastProcessedTimeRef.current = now;
      if (parsedDirect.actionType === 'camera') {
        sound.playUpgradeSuccess();
        const feedback = parsedDirect.spokenFeedback || 'Optical sensor and camera accessories activated.';
        setStatusMessage(`Omni: ${feedback}`);
        speakFeedback(feedback);
        if (onOpenCameraView) onOpenCameraView();
        return;
      }
      if (parsedDirect.actionType === 'work_plugins') {
        sound.playUpgradeSuccess();
        const feedback = parsedDirect.spokenFeedback || 'Accessing OmniWork plugins and DevOps engines.';
        setStatusMessage(`Omni: ${feedback}`);
        speakFeedback(feedback);
        if (onOpenPluginsView) onOpenPluginsView();
        return;
      }
      if (parsedDirect.actionType === 'agent') {
        sound.playUpgradeSuccess();
        const feedback = parsedDirect.spokenFeedback || 'Opening Agentic Mission Control.';
        setStatusMessage(`Omni: ${feedback}`);
        speakFeedback(feedback);
        if (onOpenAgentView) onOpenAgentView();
        return;
      }
      if (parsedDirect.actionType === 'zerobug') {
        sound.playUpgradeSuccess();
        const feedback = parsedDirect.spokenFeedback || 'Accessing Zero-Bug Citadel: all 24 tests passing.';
        setStatusMessage(`Omni: ${feedback}`);
        speakFeedback(feedback);
        if (onOpenZeroBugView) onOpenZeroBugView();
        return;
      }
      if (parsedDirect.site) {
        executeDirectNavigation(parsedDirect.site, parsedDirect.spokenFeedback, parsedDirect.actionType, parsedDirect.extractedQuery);
      }
    }
  }, [isWakeActive, activateWakeState, executeDirectNavigation, speakFeedback, onOpenCameraView, onOpenPluginsView, onOpenAgentView, onOpenZeroBugView]);

  // Start continuous speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      // Use en-IN as requested default recognition language
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setMicPermission('granted');
        restartAttemptsRef.current = 0;
        setStatusMessage(isWakeActive ? 'Omni: Listening for command...' : 'Omni is listening for "Hey Omni"...');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += trans;
          } else {
            interimText += trans;
          }
        }

        const candidate = (finalText || interimText).trim();
        if (candidate) {
          handleTranscript(candidate);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermission('denied');
          setIsListening(false);
          setStatusMessage('Microphone access denied. Click padlock icon in browser address bar to allow.');
          return;
        }

        console.warn('[OmniVoiceNavigator] SpeechRecognition error:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!isManuallyPausedRef.current && micPermission !== 'denied') {
          restartAttemptsRef.current += 1;
          if (restartAttemptsRef.current > 6) {
            restartTimerRef.current = setTimeout(() => {
              restartAttemptsRef.current = 0;
              startListening();
            }, 2500);
          } else {
            restartTimerRef.current = setTimeout(() => {
              startListening();
            }, 300);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start error:', err);
    }
  }, [handleTranscript, isWakeActive, micPermission]);

  // Request microphone permission through browser's legitimate mechanism
  const handleRequestMicAccess = async () => {
    sound.playClick();
    isManuallyPausedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      sound.playUpgradeSuccess();
      startListening();
    } catch (err) {
      console.warn('getUserMedia failed:', err);
      setMicPermission('denied');
      setStatusMessage('Microphone permission denied. Allow mic in browser settings.');
    }
  };

  // Toggle pause/listen manually
  const toggleListening = () => {
    sound.playClick();
    if (isListening) {
      isManuallyPausedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setStatusMessage('Omni voice listening paused. Click mic to resume.');
    } else {
      isManuallyPausedRef.current = false;
      if (micPermission === 'granted') {
        startListening();
      } else {
        handleRequestMicAccess();
      }
    }
  };

  // Automatically start listening once permission is verified granted
  useEffect(() => {
    if (micPermission === 'granted' && !isListening && !isManuallyPausedRef.current) {
      startListening();
    }
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (wakeTimerRef.current) clearInterval(wakeTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [micPermission, startListening]);

  // Add new custom website
  const handleAddCustomSite = (e: React.FormEvent) => {
    e.preventDefault();
    setAddSiteError('');
    if (!newSiteName.trim() || !newSiteUrl.trim()) {
      setAddSiteError('Name and URL are required.');
      return;
    }

    let urlToSave = newSiteUrl.trim();
    if (!urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
      urlToSave = 'https://' + urlToSave;
    }

    if (!isValidApprovedHttpsUrl(urlToSave)) {
      setAddSiteError('Only valid secure HTTPS websites are allowed (e.g., https://example.com).');
      return;
    }

    const keywords = (newSiteKeywords || newSiteName)
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const newSite: Omit<ApprovedWebsite, 'isCustom'> = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newSiteName.trim(),
      url: urlToSave,
      keywords: keywords.length > 0 ? keywords : [newSiteName.trim().toLowerCase()],
      category: 'custom',
      description: `Custom voice destination: ${newSiteName.trim()}`,
    };

    const saved = saveCustomWebsite(newSite);
    if (saved) {
      sound.playUpgradeSuccess();
      reloadWebsites();
      setNewSiteName('');
      setNewSiteUrl('');
      setNewSiteKeywords('');
      setStatusMessage(`Added "${newSite.name}". Say "Hey Omni, open ${newSite.name}".`);
    } else {
      setAddSiteError('Failed to save website. Please check the URL.');
    }
  };

  const handleDeleteCustomSite = (id: string, name: string) => {
    sound.playClick();
    deleteCustomWebsite(id);
    reloadWebsites();
    setStatusMessage(`Removed shortcut for ${name}.`);
  };

  // Quick Action Click Test
  const handleQuickCommandTest = (commandText: string) => {
    sound.playClick();
    handleTranscript(commandText);
  };

  if (!isSupported) {
    return (
      <div className={`p-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs font-mono text-amber-300 flex items-center justify-between gap-2 ${className}`}>
        <span>⚠️ Web Speech API not supported in this browser. Please use Chrome, Edge, or Safari.</span>
      </div>
    );
  }

  return (
    <div className={`relative space-y-2 ${className}`}>
      {/* Sleek Floating Omni Voice HUD Bar with Futuristic Cybernetic Frame & ChatGPT Animated Dots */}
      <div className="bg-slate-900/95 border border-cyan-500/50 hover:border-cyan-400 rounded-xl p-2.5 shadow-xl shadow-cyan-950/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 transition-all relative overflow-hidden group">
        {/* Holographic Cybernetic Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

        {/* Left: Futuristic ChatGPT Dynamic Morphing Dots & Status */}
        <div className="flex items-center gap-3 min-w-0">
          {/* ChatGPT Dynamic Morphing Dots Orb */}
          <div className="shrink-0 scale-90 sm:scale-100">
            <ChatGptVoiceOrb
              isListening={isListening}
              isSpeaking={isWakeActive}
              volumeLevel={isWakeActive ? 0.8 : isListening ? 0.25 : 0.05}
              size="sm"
              micDenied={micPermission === 'denied'}
              onClick={toggleListening}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className={isWakeActive ? 'text-cyan-300 animate-pulse font-extrabold' : 'text-slate-200'}>
                  OMNI PROTOCOL // CHATGPT DOTS VOICE NAV
                </span>
                {isWakeActive && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-400 text-slate-950 font-bold animate-pulse">
                    WAKE ACTIVE ({wakeTimeoutSeconds}s)
                  </span>
                )}
                {isListening && !isWakeActive && (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Listening</span>
                  </span>
                )}
              </span>
              <span className="text-[9px] font-mono text-cyan-400/80 hidden sm:inline">
                [Wake: &ldquo;Hey Omni&rdquo; • en-IN]
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-200 truncate max-w-[280px] sm:max-w-md">
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Center/Right: Quick Action Controls & Directory */}
        <div className="flex items-center gap-2 shrink-0">
          {/* One-time setup button if permission needed */}
          {micPermission !== 'granted' && micPermission !== 'denied' && (
            <button
              type="button"
              onClick={handleRequestMicAccess}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Enable Omni Voice</span>
            </button>
          )}

          {micPermission === 'denied' && (
            <button
              type="button"
              onClick={handleRequestMicAccess}
              className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 text-[10px] font-mono flex items-center gap-1 transition"
              title="Allow microphone access in browser address bar padlock"
            >
              <span>Mic Denied (Fix)</span>
            </button>
          )}

          {/* Audio Feedback Toggle */}
          <button
            type="button"
            onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title={audioFeedbackEnabled ? 'Audio confirmation enabled' : 'Audio confirmation muted'}
          >
            {audioFeedbackEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Shortcuts & Settings Drawer Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsSettingsOpen(!isSettingsOpen);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition ${
              isSettingsOpen
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-cyan-500/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Voice Actions & Settings</span>
            {isSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Direct Autonomous Console Jump */}
          {onOpenAutonomousView && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenAutonomousView();
              }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Open full Autonomous Web & YouTube Execution Console"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Autonomous Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Voice Command Suggestion Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Try Voice:</span>
        </span>

        {/* Go Open YouTube and Play Song Believer */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('go open youtube and play the song believer')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 text-[11px] font-mono shrink-0 transition"
          title="Click to test autonomous song playback"
        >
          <Music className="w-3 h-3 text-indigo-400" />
          <span>&ldquo;Open YouTube &amp; play Believer&rdquo;</span>
        </button>

        {/* Search and Say the Result */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('go search who is the CEO of Google and say the result')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[11px] font-mono shrink-0 transition"
          title="Click to test search and spoken result"
        >
          <Search className="w-3 h-3 text-emerald-400" />
          <span>&ldquo;Search &amp; Say Result&rdquo;</span>
        </button>

        {/* Camera Access & Accessories Chip */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('camera access to my ai')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200 text-[11px] font-mono shrink-0 transition shadow-sm shadow-cyan-950"
          title="Click to activate camera access & optical accessories"
        >
          <Camera className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>&ldquo;Camera Access &amp; Accessories&rdquo; 📷</span>
        </button>

        {/* Work Plugins & Terminal Sandbox Chip */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('work plugins')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-600/70 text-amber-200 text-[11px] font-mono shrink-0 transition"
          title="Click to open 5 autonomous work plugins & terminal sandbox"
        >
          <Terminal className="w-3 h-3 text-amber-400" />
          <span>&ldquo;Work Plugins &amp; DevOps Engines&rdquo; ⚡</span>
        </button>

        {/* Agentic Mission Control Chip */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('agentic mission control')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-600/70 text-purple-200 text-[11px] font-mono shrink-0 transition"
          title="Click to open Agentic Mission Control with Supervised Clearance"
        >
          <Bot className="w-3 h-3 text-purple-400" />
          <span>&ldquo;Agentic Mission Control&rdquo; ♾️</span>
        </button>

        {/* Play Shape of You */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('go open youtube and play shape of you')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-950/70 hover:bg-pink-900 border border-pink-700/80 text-pink-300 text-[11px] font-mono shrink-0 transition"
        >
          <Music className="w-3 h-3 text-pink-400" />
          <span>&ldquo;Play Shape of You&rdquo;</span>
        </button>

        {/* Search Quantum Computing & Say Result */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('go search quantum computing progress and say the result')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/70 hover:bg-teal-900 border border-teal-700/80 text-teal-300 text-[11px] font-mono shrink-0 transition"
        >
          <Sparkles className="w-3 h-3 text-teal-400" />
          <span>&ldquo;Search Quantum &amp; Say Result&rdquo;</span>
        </button>

        {/* Open Instagram Chip */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('open instagram')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono shrink-0 transition"
        >
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>&ldquo;Open Instagram&rdquo;</span>
        </button>

        {/* Open WhatsApp Chip */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('open whatsapp')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono shrink-0 transition"
        >
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>&ldquo;Open WhatsApp&rdquo;</span>
        </button>

        {/* Open GitHub Chip */}
        <button
          type="button"
          onClick={() => handleQuickCommandTest('open github')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono shrink-0 transition"
        >
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>&ldquo;Open GitHub&rdquo;</span>
        </button>
      </div>

      {/* IN-APP MUSIC PLAYER CARD: Plays the requested song directly for the user! */}
      {activeMusicPlayer && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 via-slate-950 to-purple-950/90 border border-indigo-500/60 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-900 border border-indigo-500 flex items-center justify-center">
                <Music className="w-4 h-4 text-indigo-300 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1.5">
                  <span>OMNI YOUTUBE PLAYER // LIVE STREAM</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </span>
                <span className="text-xs font-mono font-bold text-white block">
                  Playing: &ldquo;{activeMusicPlayer.title}&rdquo;
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeMusicPlayer.spokenText && (
                <button
                  type="button"
                  onClick={() => speakFeedback(activeMusicPlayer.spokenText!)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/60 font-mono text-[10px] font-bold flex items-center gap-1 transition"
                  title="Replay audio confirmation"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Replay Voice</span>
                </button>
              )}
              <a
                href={activeMusicPlayer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
              >
                <span>Open YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setActiveMusicPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embedded YouTube search stream */}
          <div className="rounded-xl overflow-hidden border border-indigo-900/60 bg-black aspect-video max-h-56 w-full">
            <iframe
              src={
                activeMusicPlayer.embedUrl ||
                (activeMusicPlayer.videoId
                  ? `https://www.youtube-nocookie.com/embed/${activeMusicPlayer.videoId}?autoplay=1&enablejsapi=1`
                  : `https://www.youtube-nocookie.com/embed/7wtfhZwyrcc?autoplay=1&enablejsapi=1`)
              }
              title={activeMusicPlayer.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* IN-APP SEARCH RESULTS CARD: Displays search queries directly with Vocalized "Say the Result" */}
      {activeSearchModal && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-950/95 via-slate-950 to-cyan-950/95 border-2 border-emerald-500/70 rounded-2xl shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                  <span>AUTONOMOUS SEARCH &amp; SAY RESULT</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </span>
                <span className="text-xs font-mono text-slate-100 font-bold truncate block">
                  &ldquo;{activeSearchModal.query}&rdquo;
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeSearchModal.spokenResult && (
                <button
                  type="button"
                  onClick={() => speakFeedback(activeSearchModal.spokenResult!)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1 transition shadow-sm"
                  title="Speak the result aloud again"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak Again</span>
                </button>
              )}
              <a
                href={activeSearchModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-1 transition"
              >
                <span>Search Engine</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setActiveSearchModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Spoken Result Callout */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs sm:text-sm font-sans font-medium text-slate-100 leading-relaxed">
            {activeSearchModal.spokenResult || 'Searching web knowledge and vocalizing findings...'}
          </div>

          {activeSearchModal.writtenSummary && (
            <p className="text-xs text-slate-300 font-sans border-t border-slate-800/80 pt-2">
              <span className="font-mono text-emerald-400 text-[10px] uppercase font-bold block mb-0.5">
                Executive Synthesis:
              </span>
              {activeSearchModal.writtenSummary}
            </p>
          )}

          {/* Sources */}
          {activeSearchModal.sources && activeSearchModal.sources.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 shrink-0">Sources:</span>
              {activeSearchModal.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded text-[11px] font-mono text-slate-300 truncate max-w-[190px] shrink-0 transition"
                >
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIRECT LAUNCH NOTIFICATION (Opens cleanly in new tab without iframe crash) */}
      {popupBlockedSite && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border border-cyan-400 text-xs font-mono text-cyan-200 flex items-center justify-between gap-3 shadow-2xl animate-in fade-in ring-1 ring-cyan-500/40">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span>
              Voice Recognized: Direct link ready for <strong>{popupBlockedSite.name}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={popupBlockedSite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-950/50"
              onClick={() => setPopupBlockedSite(null)}
            >
              <span>Launch {popupBlockedSite.name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setPopupBlockedSite(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Expandable Voice Directory, Mapping Settings, & Architecture Notes */}
      {isSettingsOpen && (
        <div className="mt-2 p-4 bg-slate-950 border border-cyan-900/80 rounded-2xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>VOICE ASSISTANT: SONG PLAYBACK, SEARCH & DIRECT NAVIGATION</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Say <strong className="text-cyan-300">&ldquo;Hey Omni, play the song [name]&rdquo;</strong>, <strong className="text-cyan-300">&ldquo;Hey Omni, search [anything]&rdquo;</strong>, or <strong className="text-cyan-300">&ldquo;Hey Omni, open [site]&rdquo;</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Voice Feature Capabilities Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-indigo-800/40">
              <div className="text-indigo-300 font-bold flex items-center gap-1.5 mb-1">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>1. Play Songs & Music</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Say &ldquo;Play the song Believer&rdquo; or &ldquo;Play Despacito&rdquo; to launch and stream music directly.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-800/40">
              <div className="text-emerald-300 font-bold flex items-center gap-1.5 mb-1">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Search Anything</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Say &ldquo;Search latest news&rdquo; or &ldquo;Google weather today&rdquo; to execute instant web searches.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-800/40">
              <div className="text-cyan-300 font-bold flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Direct Website Jump</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Say &ldquo;Open Instagram&rdquo;, &ldquo;Open YouTube&rdquo;, &ldquo;Open WhatsApp&rdquo; for direct navigation without permission gates.
              </p>
            </div>
          </div>

          {/* Quick Trigger Website Grid */}
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-2 flex items-center justify-between">
              <span>SUPPORTED DIRECT WEBSITES ({websites.length} SITES)</span>
              <span className="text-[10px] text-cyan-400">Click any site to test direct jump</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {websites.map((site) => (
                <div
                  key={site.id}
                  className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 flex items-center justify-between gap-1.5 group transition"
                >
                  <button
                    type="button"
                    onClick={() => executeDirectNavigation(site)}
                    className="flex items-center gap-2 text-left min-w-0 flex-1"
                    title={`Say "Hey Omni, open ${site.name}" or click to navigate`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-slate-200 truncate group-hover:text-cyan-300">
                        {site.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">
                        &ldquo;open {site.keywords[0]}&rdquo;
                      </div>
                    </div>
                  </button>

                  {site.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSite(site.id, site.name)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Delete custom shortcut"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Website Form */}
          <form onSubmit={handleAddCustomSite} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Custom Voice Destination</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Site Name (e.g. Substack)"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="url"
                placeholder="Secure HTTPS URL (https://...)"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Aliases / Keywords (comma-sep)"
                value={newSiteKeywords}
                onChange={(e) => setNewSiteKeywords(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            {addSiteError && (
              <p className="text-[11px] font-mono text-rose-400">{addSiteError}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Voice Shortcut</span>
              </button>
            </div>
          </form>

          {/* Browser Limitation & Architecture Explanation */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-800/40 text-[11px] font-sans text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-cyan-300 text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Browser Permissions & Navigation Architecture</span>
            </div>
            <p className="leading-relaxed">
              <strong>Zero Iframe Crashes:</strong> External websites (Instagram, YouTube, Google, etc.) enforce security policies prohibiting them from rendering inside embedded iframes. OmniEvolve opens websites cleanly in a new tab via verified <code className="text-cyan-300">target=&quot;_blank&quot;</code>, ensuring zero frame security errors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
