import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Video,
  VideoOff,
  SwitchCamera,
  Zap,
  Sparkles,
  Eye,
  Scan,
  Maximize2,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Crosshair,
  Shield,
  Download,
  Share2,
  Terminal,
  Activity,
  Flame,
  FileText,
  Search,
  Check,
  X,
  Sun,
  Moon,
  Compass,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';
import { KnowledgeEntry } from '../types.ts';

export type OpticalFilterMode = 'normal' | 'thermal' | 'night' | 'edge' | 'cyberpunk';
export type AnalysisMode = 'general' | 'objects' | 'ocr' | 'biometric';

interface CameraVisionMatrixProps {
  currentGen: number;
  currentIQ: number;
  onAddKnowledgeEntry?: (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'recallCount'>) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  className?: string;
  isOpenAsModal?: boolean;
  onCloseModal?: () => void;
}

export const CameraVisionMatrix: React.FC<CameraVisionMatrixProps> = ({
  currentGen,
  currentIQ,
  onAddKnowledgeEntry,
  showToast,
  className = '',
  isOpenAsModal = false,
  onCloseModal,
}) => {
  // Video Stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [opticalFilter, setOpticalFilter] = useState<OpticalFilterMode>('normal');
  const [brightnessBoost, setBrightnessBoost] = useState<number>(100); // 50 to 200%
  const [contrastBoost, setContrastBoost] = useState<number>(100);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // AI Multimodal Analysis states
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('general');
  const [userPromptQuery, setUserPromptQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeakResult, setAutoSpeakResult] = useState<boolean>(true);
  const [recentCaptures, setRecentCaptures] = useState<Array<{ id: string; image: string; summary: string; timestamp: string }>>([]);

  // Telemetry indicators
  const [fps, setFps] = useState<number>(30);
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });

  // Initialize or Stop Camera
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraPermission('unsupported');
      showToast?.('Camera API is not supported in this browser.', 'error');
      return;
    }

    try {
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      sound.playSynapticSpark();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsCameraActive(true);
      setCameraPermission('granted');
      setIsFrozen(false);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }

      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setResolution({ width: settings.width, height: settings.height });
        }
      }

      showToast?.('Optical Sensor Online: Camera stream attached.', 'success');
    } catch (err: any) {
      console.warn('[Camera Access Error]:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        showToast?.('Camera permission was denied. Please allow camera in browser address bar padlock.', 'error');
      } else {
        showToast?.('Could not open camera stream: ' + (err.message || 'Device busy'), 'error');
      }
    }
  }, [facingMode, stream, showToast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsFrozen(false);
    sound.playClick();
  }, [stream]);

  const switchCameraLens = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Speak AI Vision analysis aloud
  const speakAnalysis = useCallback((textToSpeak: string) => {
    if (!autoSpeakResult || !textToSpeak || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsSpeaking(false);
    }
  }, [autoSpeakResult]);

  // Capture frame to base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Apply digital filters if active
    if (opticalFilter === 'night') {
      ctx.filter = 'brightness(1.5) contrast(1.4) hue-rotate(90deg)';
    } else if (opticalFilter === 'thermal') {
      ctx.filter = 'invert(0.8) hue-rotate(180deg) saturate(2.5)';
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedSnapshot(dataUrl);
    return dataUrl;
  }, [opticalFilter]);

  // Execute AI Vision Multimodal Analysis
  const runVisionAnalysis = async (customQuery?: string) => {
    if (!isCameraActive && !capturedSnapshot) {
      showToast?.('Please activate the camera first to analyze optical sensory input.', 'error');
      return;
    }

    const frameBase64 = captureFrame();
    if (!frameBase64) {
      showToast?.('Could not capture frame from optical stream.', 'error');
      return;
    }

    sound.playSynapticSpark();
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: frameBase64,
          mode: analysisMode,
          userQuery: customQuery || userPromptQuery,
          currentGen,
        }),
      });

      const data = await response.json();
      if (data && data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        sound.playUpgradeSuccess();

        const summary = data.analysis.spokenSummary || data.analysis.detailedDescription;
        if (summary) {
          speakAnalysis(summary);
        }

        // Add to recent captures
        setRecentCaptures((prev) => [
          {
            id: `snap-${Date.now()}`,
            image: frameBase64,
            summary: data.analysis.spokenSummary || 'Vision Observation',
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 5),
        ]);

        showToast?.('AI Vision Analysis Complete: Optical entities decoded.', 'success');
      } else {
        throw new Error(data?.error || 'Analysis returned invalid payload');
      }
    } catch (err: unknown) {
      console.error('[Vision Analysis Error]:', err);
      showToast?.('Vision analysis failed. Ensure camera is unobstructed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Archive Vision Findings to Knowledge Vault
  const handleArchiveToVault = () => {
    if (!analysisResult) return;
    const candidate = analysisResult.knowledgeVaultCandidate;
    const title = candidate?.title || `Optical Observation: ${analysisResult.spokenSummary?.slice(0, 30)}...`;
    const summary = candidate?.summary || analysisResult.spokenSummary || 'Camera vision sensory scan';
    const content = `[OPTICAL SENSORY ANALYSIS - GEN ${currentGen}]\n\nSummary:\n${analysisResult.spokenSummary}\n\nDetailed Scene Context:\n${analysisResult.detailedDescription}\n\nDetected Entities:\n${(analysisResult.detectedEntities || []).map((e: any) => `- ${e.name} (${e.category}, ${e.confidence}% conf)`).join('\n')}\n\nExtracted Text / OCR:\n${analysisResult.extractedText || 'None detected'}\n\nBiometrics / Ambiance:\n${analysisResult.biometricOrMood || 'Standard illumination'}`;

    if (onAddKnowledgeEntry) {
      onAddKnowledgeEntry({
        title,
        category: 'finding',
        summary,
        content,
        tags: candidate?.tags || ['OpticalVision', 'CameraFeed', 'Multimodal'],
        sourceOrigin: 'operator_manual',
        confidenceScore: 98,
        activeInRecall: true,
      });
      sound.playUpgradeSuccess();
      showToast?.(`Archived visual analysis to Knowledge Vault: "${title}"`, 'success');
    }
  };

  // Auto start camera if mounted directly in tab
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Compute CSS filter styling based on accessories / optical mode
  const getFilterStyle = (): React.CSSProperties => {
    const filters: string[] = [];
    filters.push(`brightness(${brightnessBoost}%)`);
    filters.push(`contrast(${contrastBoost}%)`);

    if (opticalFilter === 'thermal') {
      filters.push('invert(0.9) hue-rotate(190deg) saturate(3) contrast(1.5)');
    } else if (opticalFilter === 'night') {
      filters.push('hue-rotate(90deg) saturate(2) brightness(1.3) contrast(1.4)');
    } else if (opticalFilter === 'edge') {
      filters.push('grayscale(1) contrast(3) invert(0.2)');
    } else if (opticalFilter === 'cyberpunk') {
      filters.push('hue-rotate(150deg) saturate(2.2) contrast(1.2)');
    }

    return { filter: filters.join(' ') };
  };

  return (
    <div className={`space-y-4 font-mono ${className}`}>
      {/* Top Sensory HUD Bar */}
      <div className="bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 relative overflow-hidden">
        {/* Glow corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-950/60">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                OPTICAL VISION MATRIX <span className="text-cyan-400">// MULTIMODAL SENSORY SUITE</span>
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                  isCameraActive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-950 text-rose-300 border-rose-500/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                  }`}
                />
                <span>{isCameraActive ? 'SENSOR ACTIVE' : 'OFFLINE'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Real-time webcam telemetry, live multimodal scene understanding, OCR reader, and optical filters.
            </p>
          </div>
        </div>

        {/* Top Control Accessories */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Camera Stream */}
          {isCameraActive ? (
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>Disable Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCamera()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-950"
            >
              <Video className="w-3.5 h-3.5 text-slate-950" />
              <span>Enable Camera</span>
            </button>
          )}

          {/* Switch Camera Lens (Front/Back) */}
          <button
            type="button"
            onClick={switchCameraLens}
            disabled={!isCameraActive}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500 transition disabled:opacity-40"
            title="Switch between front and back camera lens"
          >
            <SwitchCamera className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Audio Speech Toggle */}
          <button
            type="button"
            onClick={() => setAutoSpeakResult(!autoSpeakResult)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500 transition"
            title={autoSpeakResult ? 'Voice result active' : 'Voice result muted'}
          >
            {autoSpeakResult ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {isOpenAsModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Camera Permission Alert Banner (if prompt/denied) */}
      {cameraPermission === 'denied' && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Camera permission is blocked. Click the padlock icon in your browser address bar and toggle Camera to &ldquo;Allow&rdquo;.
            </span>
          </div>
          <button
            type="button"
            onClick={() => startCamera()}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs shrink-0"
          >
            Retry Access
          </button>
        </div>
      )}

      {/* Main Grid: Video Stream + Multimodal Analysis Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: LIVE OPTICAL VIEWPORT & ACCESSORIES (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Viewport Frame */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-black aspect-video shadow-2xl group flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-all"
              style={getFilterStyle()}
            />

            {/* Hidden canvas for snapshot capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Holographic Cyberpunk Targeting Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              {/* Top Calipers */}
              <div className="flex items-center justify-between text-[10px] text-cyan-400/90 font-mono">
                <div className="flex items-center gap-1.5 bg-slate-950/70 border border-cyan-500/40 px-2 py-0.5 rounded">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>ISO AUTO • {resolution.width}x{resolution.height} • {fps}FPS</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950/70 border border-cyan-500/40 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span className="uppercase">OPTICAL HUD: {opticalFilter}</span>
                </div>
              </div>

              {/* Center Crosshairs */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <Crosshair className="w-16 h-16 text-cyan-400/60 animate-pulse" />
                <div className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>

              {/* Bottom Sensor Telemetry */}
              <div className="flex items-center justify-between text-[10px] text-cyan-300/80 font-mono">
                <span className="bg-slate-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                  LENS: {facingMode.toUpperCase()}
                </span>
                <span className="bg-slate-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                  FOCAL PLANE: LOCKED
                </span>
              </div>

              {/* Animated Laser Scanning Line when analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />
              )}
            </div>

            {/* Offline Placeholder if Camera is Disabled */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">Optical Stream Suspended</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Activate the camera stream to grant J.A.R.V.I.S. visual sensory awareness of your environment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950 transition"
                >
                  <Video className="w-4 h-4" />
                  <span>Grant Camera Access</span>
                </button>
              </div>
            )}
          </div>

          {/* Camera Accessories & Filter Control Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-[11px] font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Optical Accessories &amp; HUD Modes</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Filter: {opticalFilter.toUpperCase()}</span>
            </div>

            {/* Filter Modes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setOpticalFilter('normal');
                }}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                  opticalFilter === 'normal'
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Natural 4K</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setOpticalFilter('thermal');
                }}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                  opticalFilter === 'thermal'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Infrared</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setOpticalFilter('night');
                }}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                  opticalFilter === 'night'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <Moon className="w-3 h-3 text-emerald-400" />
                <span>Night Vision</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setOpticalFilter('edge');
                }}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                  opticalFilter === 'edge'
                    ? 'bg-indigo-500 text-slate-950 font-bold border-indigo-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Sobel Edge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setOpticalFilter('cyberpunk');
                }}
                className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                  opticalFilter === 'cyberpunk'
                    ? 'bg-violet-500 text-slate-950 font-bold border-violet-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-violet-500/50'
                }`}
              >
                <Zap className="w-3 h-3 text-violet-400" />
                <span>Cyberpunk</span>
              </button>
            </div>

            {/* Brightness & Sensor Exposure Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="w-20 shrink-0">Sensor Gain:</span>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={brightnessBoost}
                  onChange={(e) => setBrightnessBoost(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-300 text-[10px] w-8">{brightnessBoost}%</span>
              </div>

              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="w-20 shrink-0">Contrast:</span>
                <input
                  type="range"
                  min="70"
                  max="160"
                  value={contrastBoost}
                  onChange={(e) => setContrastBoost(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <span className="text-indigo-300 text-[10px] w-8">{contrastBoost}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MULTIMODAL AI VISION COGNITION & ACTIONS (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          {/* AI Analysis Mode Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Scan className="w-4 h-4 text-cyan-400" />
                <span>VISION COGNITIVE MODES</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">GEN {currentGen} MATRIX</span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAnalysisMode('general')}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition ${
                  analysisMode === 'general'
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scene Overview</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans leading-tight">
                  Full environmental context &amp; ambient description.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('objects')}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition ${
                  analysisMode === 'objects'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Scan className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Object Detector</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans leading-tight">
                  Catalog devices, items, tools, and entities.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('ocr')}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition ${
                  analysisMode === 'ocr'
                    ? 'bg-indigo-950/90 border-indigo-400 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Document OCR</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans leading-tight">
                  Extract visible text, code, books, or screens.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('biometric')}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition ${
                  analysisMode === 'biometric'
                    ? 'bg-pink-950/90 border-pink-400 text-pink-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-pink-400" />
                  <span>Operator Biometric</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans leading-tight">
                  Facial focus, emotion, gaze, and posture.
                </span>
              </button>
            </div>

            {/* Custom Optical Query Input */}
            <div className="relative">
              <input
                type="text"
                value={userPromptQuery}
                onChange={(e) => setUserPromptQuery(e.target.value)}
                placeholder="Ask specific optical question (e.g. 'What is this object?')"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
              />
            </div>

            {/* Main Scan & Trigger Button */}
            <button
              type="button"
              onClick={() => runVisionAnalysis()}
              disabled={isAnalyzing || !isCameraActive}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/80 transition disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Decoding Optical Photons...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Execute Optical Sensory Scan</span>
                </>
              )}
            </button>
          </div>

          {/* AI VISION ANALYSIS RESULTS CARD */}
          {analysisResult && (
            <div className="bg-slate-900/95 border-2 border-emerald-500/70 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>OPTICAL FINDINGS DECODED</span>
                </div>

                <div className="flex items-center gap-2">
                  {analysisResult.spokenSummary && (
                    <button
                      type="button"
                      onClick={() => speakAnalysis(analysisResult.spokenSummary)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition"
                      title="Speak optical analysis aloud again"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Speak Again</span>
                    </button>
                  )}

                  {onAddKnowledgeEntry && (
                    <button
                      type="button"
                      onClick={handleArchiveToVault}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                      title="Archive findings to Knowledge Vault"
                    >
                      <Database className="w-3 h-3" />
                      <span>Archive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Spoken Vocalized Result */}
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs sm:text-sm text-slate-100 font-sans font-medium leading-relaxed">
                &ldquo;{analysisResult.spokenSummary}&rdquo;
              </div>

              {/* Detailed Description */}
              {analysisResult.detailedDescription && (
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {analysisResult.detailedDescription}
                </p>
              )}

              {/* Detected Entities Badges */}
              {analysisResult.detectedEntities && analysisResult.detectedEntities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                    Recognized Entities ({analysisResult.detectedEntities.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detectedEntities.map((ent: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-[10px] flex items-center gap-1"
                      >
                        <span className="text-emerald-400 font-bold">{ent.name}</span>
                        <span className="text-slate-500 text-[9px]">({ent.category})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted OCR Text if any */}
              {analysisResult.extractedText && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-900/60 text-xs">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1">
                    Extracted Text / OCR:
                  </span>
                  <p className="font-mono text-slate-200 text-[11px] whitespace-pre-wrap">
                    {analysisResult.extractedText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
