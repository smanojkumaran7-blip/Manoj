import React from 'react';
import { AgentTaskStep } from '../types.ts';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  X,
  Check,
  Cpu,
  Brain,
  Database,
  Terminal,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface AgentPermissionModalProps {
  step: AgentTaskStep | null;
  missionGoal?: string;
  onAuthorizeOnce: () => void;
  onAuthorizeSessionCategory: () => void;
  onDeny: (reason?: string) => void;
  onHaltMission: () => void;
}

export const AgentPermissionModal: React.FC<AgentPermissionModalProps> = ({
  step,
  missionGoal,
  onAuthorizeOnce,
  onAuthorizeSessionCategory,
  onDeny,
  onHaltMission,
}) => {
  if (!step) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/80 border-rose-600/80';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/80 border-amber-600/80';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950/70 border-yellow-600/70';
      case 'LOW':
      default:
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-600/80';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-amber-500/80 rounded-2xl max-w-xl w-full flex flex-col shadow-2xl shadow-amber-950/70 overflow-hidden relative">
        {/* Top Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/90 border border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  OPERATOR PERMISSION REQUIRED
                </h2>
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getRiskColor(
                    step.risk
                  )}`}
                >
                  {step.risk} RISK
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                J.A.R.V.I.S. Agentic Protocol // Step #{step.stepNumber} Authorization Gate
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onDeny('Modal dismissed by Operator');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss / Deny"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {/* Active Mission Context */}
          {missionGoal && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
                Target Infinite Mission:
              </span>
              <span className="text-cyan-300 font-semibold">{missionGoal}</span>
            </div>
          )}

          {/* Action Header Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Proposed Action</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-bold">
                {step.category}
              </span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{step.title}</span>
            </div>
            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Rationale & Impact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-cyan-950/20 border border-cyan-800/50 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                Agent Rationale:
              </span>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {step.rationale}
              </p>
            </div>

            <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Potential Impact:
              </span>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {step.potentialImpact}
              </p>
            </div>
          </div>

          {/* Technical Payload Preview */}
          {step.targetPayload && Object.keys(step.targetPayload).length > 0 && (
            <div className="bg-black/60 border border-slate-800 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span>Execution Parameters:</span>
                </span>
                <span className="text-slate-400 font-mono text-[9px]">Type: {step.actionType}</span>
              </div>
              <pre className="text-[10px] text-cyan-300 overflow-x-auto p-1.5 bg-slate-950/80 rounded border border-slate-900">
                {JSON.stringify(step.targetPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Operator Rights Notice */}
          <div className="text-[10px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              By design, J.A.R.V.I.S. respects your sovereign authority. No state changes, knowledge commits, or neural rewires occur until you authorize clearance.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 font-mono text-xs">
          <button
            onClick={() => {
              sound.playClick();
              onHaltMission();
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-950/50 border border-rose-900/50 transition"
          >
            Halt Mission
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                sound.playClick();
                onDeny('Operator denied step');
              }}
              className="px-3 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Deny Step
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onAuthorizeSessionCategory();
              }}
              className="px-3 py-2 rounded-xl text-cyan-300 hover:text-white bg-cyan-950/80 border border-cyan-700 hover:bg-cyan-900 transition text-[11px]"
              title="Grant session clearance for all steps in this category"
            >
              Allow Category (Session)
            </button>

            <button
              onClick={() => {
                sound.playUpgradeSuccess();
                onAuthorizeOnce();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Authorize & Execute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
