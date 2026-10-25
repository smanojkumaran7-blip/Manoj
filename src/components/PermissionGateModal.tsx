import React, { useState, useEffect, useRef } from 'react';
import { ExternalPermissionRequest } from '../types.ts';
import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  X,
  Check,
  Lock,
  Globe,
  AppWindow,
  AlertTriangle,
  Mic,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface PermissionGateModalProps {
  request: ExternalPermissionRequest | null;
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionGateModal: React.FC<PermissionGateModalProps> = ({
  request,
  onAllow,
  onDeny,
}) => {
  const [voiceDetected, setVoiceDetected] = useState<string | null>(null);
  const [isListeningForVoice, setIsListeningForVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Active Speech Recognition: Opens with voice saying "Permission granted" without clicking on screen
  useEffect(() => {
    if (!request) {
      setVoiceDetected(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningForVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
          .toLowerCase();

        const isGranted =
          transcript.includes('permission granted') ||
          transcript.includes('grant permission') ||
          transcript.includes('granted') ||
          transcript.includes('permission grant') ||
          transcript.includes('authorize') ||
          transcript.includes('authorized') ||
          transcript.includes('allow') ||
          transcript.includes('open it') ||
          transcript.includes('yes open') ||
          transcript.includes('proceed') ||
          transcript.includes('clearance');

        if (isGranted) {
          setVoiceDetected('Permission Granted');
          sound.playUpgradeSuccess();
          setTimeout(() => {
            onAllow();
          }, 350);
        }
      };

      recognition.onerror = () => {
        // Continue silently
      };

      recognition.onend = () => {
        // Auto-restart if request is still active
        if (request && recognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {}
      };
    } catch (e) {
      console.warn('Voice listener initialization note:', e);
    }
  }, [request]);

  if (!request) return null;

  const handleSimulateVoiceClearance = () => {
    setVoiceDetected('Permission Granted');
    sound.playUpgradeSuccess();
    setTimeout(() => {
      onAllow();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-emerald-500/70 rounded-2xl max-w-lg w-full flex flex-col shadow-2xl shadow-emerald-950/60 overflow-hidden relative">
        {/* Top Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldAlert className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                OPERATOR SCREEN PERMISSION
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                J.A.R.V.I.S. External Navigation Gate // Dual Clearance
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onDeny();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* VOICE CLEARANCE HIGHLIGHT BANNER */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-300 ${
              voiceDetected
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400 animate-pulse shadow-lg shadow-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border-emerald-500/70 text-slate-200 shadow-md shadow-emerald-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center shrink-0">
                <Mic className={`w-4 h-4 text-emerald-300 ${isListeningForVoice ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                  <span>VOICE CLEARANCE ACTIVE</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                  {voiceDetected ? (
                    <span className="text-emerald-300 font-bold">
                      ✓ Voice recognized: &ldquo;Permission Granted&rdquo;! Opening resource...
                    </span>
                  ) : (
                    <span>
                      Speak <strong className="text-emerald-300">&ldquo;Permission granted&rdquo;</strong> into mic or click below!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateVoiceClearance}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-[10px] flex items-center gap-1 shadow-sm shrink-0 transition"
              title="Trigger voice permission directly"
            >
              <Volume2 className="w-3 h-3 text-slate-950" />
              <span>Voice Grant</span>
            </button>
          </div>

          <div className="bg-amber-950/20 border border-amber-600/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-mono text-amber-300 block mb-0.5">
                Screen & Voice Authorization:
              </strong>
              <span>
                J.A.R.V.I.S. requires Operator Permission. You can say <strong>&ldquo;Permission granted&rdquo;</strong> or click <strong>&ldquo;Grant Screen Permission&rdquo;</strong> to open immediately.
              </span>
            </div>
          </div>

          {/* Target Resource Details */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
              <span className="flex items-center gap-1.5">
                {request.type === 'website' ? (
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <AppWindow className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span className="uppercase font-bold text-slate-300">
                  Target: {request.type === 'website' ? 'External Website / URL' : 'External Application / Tool'}
                </span>
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> SSL TLS 1.3
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Destination Title:</span>
              <span className="font-bold text-slate-100 text-sm">{request.title || 'External Destination'}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Destination Link:</span>
              <div className="bg-black/60 p-2 rounded border border-slate-800 text-cyan-300 font-mono text-[11px] break-all select-all flex items-center justify-between gap-2">
                <span>{request.url}</span>
                <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
              </div>
            </div>

            {request.description && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Origin Directive:</span>
                <span className="text-slate-300 text-[11px] font-sans">{request.description}</span>
              </div>
            )}
          </div>

          {/* Security Assurance Badge */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-850">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure popup container. Direct launch link ensures zero popup-blocker interference.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-2.5">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Voice: &ldquo;Permission granted&rdquo;</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onDeny();
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Deny</span>
            </button>

            <a
              href={request.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                sound.playUpgradeSuccess();
                setTimeout(() => onAllow(), 100);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-950/60"
              title="Open directly in a new tab without popup blocker"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Direct Link</span>
            </a>

            <button
              onClick={() => {
                sound.playUpgradeSuccess();
                onAllow();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/60"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Grant Screen Permission</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
