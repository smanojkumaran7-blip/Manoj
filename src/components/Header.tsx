import React from 'react';
import {
  Brain,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Sparkles,
  Mic,
  ShieldCheck,
  Bot,
  Wrench,
  Globe,
  Camera,
  Plug,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';
import { SUPPORTED_LANGUAGES } from '../utils/initialState.ts';

interface HeaderProps {
  currentGen: number;
  currentIQ: number;
  isAutoEvolving: boolean;
  onToggleAutoEvolve: () => void;
  onManualEvolve: () => void;
  isBusy: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenVoiceModal: () => void;
  onOpenCapabilities: () => void;
  onOpenSecurity: () => void;
  requirePermissionToOpen: boolean;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  countdown: number;
  onOpenSelfHealing: () => void;
  onSwitchTab?: (tab: 'matrix' | 'chamber' | 'vault' | 'lineage' | 'gauntlet' | 'plugins' | 'agent' | 'autonomous' | 'camera' | 'zerobug') => void;
  isInfiniteLoopRunning?: boolean;
  autoHealedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentGen,
  currentIQ,
  isAutoEvolving,
  onToggleAutoEvolve,
  onManualEvolve,
  isBusy,
  soundEnabled,
  onToggleSound,
  onReset,
  onExport,
  onImport,
  onOpenVoiceModal,
  onOpenCapabilities,
  onOpenSecurity,
  requirePermissionToOpen,
  selectedLanguage,
  onSelectLanguage,
  countdown,
  onOpenSelfHealing,
  onSwitchTab,
  isInfiniteLoopRunning = false,
  autoHealedCount = 4,
}) => {
  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Gen Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                  OMNI<span className="text-cyan-400">EVOLVE</span>
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold tracking-wider">
                  OMNI PROTOCOL // VOICE NAV
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Autonomous Recursive AI • Direct Voice Navigation Core
              </p>
            </div>
          </div>

          {/* Quick Metrics Tag */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-center font-mono">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Generation</div>
              <div className="text-sm font-bold text-amber-400">GEN {currentGen}</div>
            </div>
            <div className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-center font-mono">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Synthetic IQ</div>
              <div className="text-sm font-bold text-cyan-400">{currentIQ}</div>
            </div>
          </div>
        </div>

        {/* Action Controls & Autonomous Loop */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Universal Language Selector */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  sound.playClick();
                  onSelectLanguage(e.target.value);
                }}
                className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer pr-1"
                title="Select J.A.R.V.I.S. Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capabilities Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenCapabilities();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-700/80 hover:bg-indigo-900/80 hover:border-indigo-500 transition shadow-sm"
            title="Overview of everything J.A.R.V.I.S. can do for you"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>What Can Jarvis Do?</span>
          </button>

          {/* Agentic Core Button */}
          {onSwitchTab && (
            <button
              onClick={() => {
                sound.playClick();
                onSwitchTab('agent');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-sm border ${
                isInfiniteLoopRunning
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 animate-pulse'
                  : 'bg-cyan-950/70 text-cyan-300 border-cyan-700/80 hover:bg-cyan-900/80 hover:border-cyan-500'
              }`}
              title="Autonomous Agentic AI & Infinite Task Engine"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agentic Core ♾️</span>
              {isInfiniteLoopRunning && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          )}

          {/* Work Plugins & DevOps Engines Button */}
          {onSwitchTab && (
            <button
              onClick={() => {
                sound.playClick();
                onSwitchTab('plugins');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-700/80 hover:bg-indigo-900/80 hover:border-indigo-500 transition shadow-sm"
              title="OmniWork: 5 Specialized Work Plugins & DevOps Engines"
            >
              <Plug className="w-3.5 h-3.5 text-indigo-400" />
              <span>Work Plugins ⚡</span>
            </button>
          )}

          {/* Operator Permissions Gate Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSecurity();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900/80 hover:border-emerald-500 transition shadow-sm"
            title="Operator Authorization Console & Permissions Status"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Permissions Gate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* AI Self-Healer & Autonomous Bug Fixer */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSelfHealing();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 hover:bg-emerald-900/80 hover:border-emerald-400 transition shadow-md shadow-emerald-950/40"
            title="AI Autonomous Bug Resolver & Subsystem Self-Healing (Bugs are changed by its own)"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Self-Healer</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-slate-950 font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
              <span>{autoHealedCount || 4} Auto-Fixed</span>
            </span>
          </button>

          {/* Camera Matrix & Optical Accessories Button */}
          {onSwitchTab && (
            <button
              onClick={() => {
                sound.playClick();
                onSwitchTab('camera');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/70 hover:bg-cyan-900/80 hover:border-cyan-400 transition shadow-md shadow-cyan-950/40"
              title="Camera access & optical vision accessories for your AI"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Camera Matrix 📷</span>
            </button>
          )}

          {/* Zero-Bug Citadel & Integration Test Suite */}
          {onSwitchTab && (
            <button
              onClick={() => {
                sound.playClick();
                onSwitchTab('zerobug');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/70 hover:bg-emerald-900/80 hover:border-emerald-400 transition shadow-md shadow-emerald-950/40"
              title="Zero-Bug Citadel: Automated Integration & Mutation Test Suite with Visual Patch Diffs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Bug Citadel 🛡️</span>
            </button>
          )}

          {/* Live Voice Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenVoiceModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700 hover:bg-cyan-900/80 hover:border-cyan-500 transition shadow-md shadow-cyan-950/40"
            title="Talk to JARVIS with Gemini 3.8 Live API"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>JARVIS Voice</span>
          </button>

          {/* Autonomous Loop Switch */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleAutoEvolve();
            }}
            disabled={isBusy && !isAutoEvolving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shadow-md ${
              isAutoEvolving
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-500/40'
                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
            title="When active, the AI autonomously diagnoses flaws and evolves continuously"
          >
            {isAutoEvolving ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Auto-Loop ({countdown}s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>Continuous Evolution</span>
              </>
            )}
          </button>

          {/* Single Trigger Self-Evolution Button */}
          <button
            onClick={() => {
              sound.playClick();
              onManualEvolve();
            }}
            disabled={isBusy}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-lg ${
              isBusy
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 active:scale-95'
            }`}
          >
            {isBusy ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Upgrade Cycle</span>
              </>
            )}
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              onToggleSound();
            }}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition"
            title={soundEnabled ? 'Mute Sci-Fi Audio' : 'Unmute Sci-Fi Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Export Genome */}
          <button
            onClick={() => {
              sound.playClick();
              onExport();
            }}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition"
            title="Export Brain Genome JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Import Genome */}
          <button
            onClick={() => {
              sound.playClick();
              onImport();
            }}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition"
            title="Import Brain Genome"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Reset Genesis */}
          <button
            onClick={() => {
              sound.playClick();
              onReset();
            }}
            className="p-1.5 rounded-lg bg-slate-900 text-rose-400/80 hover:text-rose-300 border border-slate-800 hover:bg-slate-800 transition"
            title="Reset to Gen 1 Genesis State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
