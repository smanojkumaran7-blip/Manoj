import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Mic,
  MicOff,
  Globe,
  ExternalLink,
  Volume2,
  Lock,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface SecurityPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirePermissionToOpen: boolean;
  onToggleRequirePermission: () => void;
}

export const SecurityPermissionsModal: React.FC<SecurityPermissionsModalProps> = ({
  isOpen,
  onClose,
  requirePermissionToOpen,
  onToggleRequirePermission,
}) => {
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micMessage, setMicMessage] = useState<string>('');

  const checkMicrophoneStatus = async () => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        setMicStatus(result.state as 'prompt' | 'granted' | 'denied');
        result.onchange = () => {
          setMicStatus(result.state as 'prompt' | 'granted' | 'denied');
        };
      } else {
        setMicStatus('prompt');
      }
    } catch {
      setMicStatus('prompt');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkMicrophoneStatus();
    }
  }, [isOpen]);

  const handleRequestMicAccess = async () => {
    setIsTestingMic(true);
    setMicMessage('');
    sound.playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Successfully granted
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
      setMicMessage('Microphone access verified and granted!');
      sound.playUpgradeSuccess();
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err);
      setMicStatus('denied');
      setMicMessage(
        'Permission denied by browser. Click the lock/camera icon in your address bar to allow microphone access.'
      );
    } finally {
      setIsTestingMic(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-emerald-500/60 rounded-2xl max-w-xl w-full flex flex-col shadow-2xl shadow-emerald-950/50 overflow-hidden relative">
        {/* Top Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                OMNIEVOLVE SECURITY & VOICE NAVIGATION SETTINGS
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Direct Voice Clearance • Genuine Hardware Permissions
              </p>
            </div>
          </div>

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

        {/* Permissions Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Rule Notice */}
          <div className="bg-slate-900/80 border border-cyan-800/50 rounded-xl p-3.5 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <strong className="font-mono text-cyan-300 block mb-0.5">
                Active Directive: Direct Voice Navigation Enabled
              </strong>
              <span>
                Supported websites navigate directly upon voice recognition without interrupting you with Operator Screen Permission popups. Only legitimate microphone access is used.
              </span>
            </div>
          </div>

          {/* Permission 1: Direct Voice Navigation */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-700/60 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Direct Voice Navigation (No Dashboard Popups)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Direct Mode Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Voice commands navigate directly to approved HTTPS destinations (Instagram, YouTube, Google, Facebook, WhatsApp, GitHub, etc.).
                  </p>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-[10px] font-mono font-bold">
                DIRECT OPEN
              </div>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-900/40 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Zero dashboard interference: Voice commands open websites directly without screen permission gates.
              </span>
            </div>
          </div>

          {/* Permission 2: Microphone & Speech Input */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    micStatus === 'granted'
                      ? 'bg-emerald-950/70 border-emerald-700/60'
                      : micStatus === 'denied'
                      ? 'bg-amber-950/70 border-amber-700/60'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  {micStatus === 'granted' ? (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <MicOff className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Microphone & Voice Input</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        micStatus === 'granted'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : micStatus === 'denied'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {micStatus === 'granted'
                        ? 'Granted'
                        : micStatus === 'denied'
                        ? 'Permission Denied / Blocked'
                        : 'Prompt Required'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Powers speech-to-text in Cognitive Chamber and Gemini 3.8 Live API duplex speech.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequestMicAccess}
                disabled={isTestingMic}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingMic ? 'animate-spin' : ''}`} />
                <span>{micStatus === 'granted' ? 'Re-Verify Mic' : 'Request Mic Access'}</span>
              </button>
            </div>

            {/* Diagnostic Message */}
            {micMessage && (
              <div
                className={`text-[11px] font-mono p-2.5 rounded border flex items-start gap-1.5 ${
                  micStatus === 'granted'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                }`}
              >
                {micStatus === 'granted' ? (
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                )}
                <span>{micMessage}</span>
              </div>
            )}

            {micStatus === 'denied' && (
              <div className="bg-amber-950/20 border border-amber-700/40 rounded-lg p-2.5 text-[11px] text-amber-200/90 font-sans space-y-1">
                <strong>How to enable microphone in your browser:</strong>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-amber-300/80 font-mono">
                  <li>Click the padlock icon 🔒 in your browser URL address bar</li>
                  <li>Find &ldquo;Microphone&rdquo; in Site settings and set to &ldquo;Allow&rdquo;</li>
                  <li>Click &ldquo;Request Mic Access&rdquo; above to re-activate</li>
                </ol>
              </div>
            )}
          </div>

          {/* Permission 3: Speech Audio Output */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-700/60 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Audio & Speech Synthesis (TTS)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Gemini 3.8 Flash Lite text-to-speech audio voice output.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playUpgradeSuccess();
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700"
            >
              Test Audio Chime
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Zero automatic external execution. Operator approval required.</span>
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
