import React from 'react';
import { EvolutionPhase } from '../types.ts';
import { Search, Dna, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

interface EvolutionProgressBannerProps {
  phase: EvolutionPhase;
  telemetryMsg?: string;
}

export const EvolutionProgressBanner: React.FC<EvolutionProgressBannerProps> = ({
  phase,
  telemetryMsg,
}) => {
  if (phase === 'IDLE') return null;

  const steps = [
    {
      key: 'DIAGNOSING',
      label: 'Phase 1: Diagnostic Scan',
      desc: 'Probing cognitive edge & identifying reasoning flaws',
      icon: Search,
    },
    {
      key: 'MUTATING',
      label: 'Phase 2: Synaptic Mutation',
      desc: 'Synthesizing new heuristic directive & cognitive module',
      icon: Dna,
    },
    {
      key: 'BENCHMARKING',
      label: 'Phase 3: Benchmark Stress-Test',
      desc: 'Empirically evaluating candidate on boundary puzzles',
      icon: ShieldAlert,
    },
    {
      key: 'INTEGRATING',
      label: 'Phase 4: Synaptic Ratification',
      desc: 'Promoting upgrade to core genome & boosting IQ',
      icon: Sparkles,
    },
  ];

  const currentIdx = steps.findIndex((s) => s.key === phase);

  return (
    <div className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            AUTONOMOUS RECURSIVE UPGRADE ENGINE // CYCLE ACTIVE
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Step {Math.max(1, currentIdx + 1)} of 4
        </span>
      </div>

      {/* Progress Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        {steps.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = isDone ? CheckCircle : step.icon;

          return (
            <div
              key={step.key}
              className={`p-2.5 rounded-lg border font-mono transition-all ${
                isCurrent
                  ? 'bg-cyan-950/60 border-cyan-400/80 shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400/50'
                  : isDone
                  ? 'bg-slate-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    isCurrent
                      ? 'text-cyan-300 animate-bounce'
                      : isDone
                      ? 'text-emerald-400'
                      : 'text-slate-600'
                  }`}
                />
                <span
                  className={`text-[11px] font-bold ${
                    isCurrent ? 'text-cyan-200' : isDone ? 'text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {telemetryMsg && (
        <div className="mt-3 bg-black/60 rounded px-3 py-1.5 border border-slate-800/80 font-mono text-[11px] text-cyan-400 flex items-center gap-2">
          <span className="text-slate-500">&gt;</span>
          <span className="animate-pulse">{telemetryMsg}</span>
        </div>
      )}
    </div>
  );
};
