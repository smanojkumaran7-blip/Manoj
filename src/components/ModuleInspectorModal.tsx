import React from 'react';
import { SynapticModule } from '../types.ts';
import { X, Sparkles, Cpu, Check, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface ModuleInspectorModalProps {
  module: SynapticModule | null;
  onClose: () => void;
  onToggleActive: (moduleId: string) => void;
}

export const ModuleInspectorModal: React.FC<ModuleInspectorModalProps> = ({
  module,
  onClose,
  onToggleActive,
}) => {
  if (!module) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-lg w-full p-5 shadow-2xl shadow-cyan-950/50 relative">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono text-white">
                {module.name}
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                {module.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Synthesized in Generation {module.generationIntroduced} // Potency: {module.potency}%
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-1">
            Cognitive Function:
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">
            {module.description}
          </p>
        </div>

        {/* Synthesized Rule Code */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Synthesized Imperative Directive:
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              RUNTIME DIRECTIVE
            </span>
          </div>
          <div className="bg-black/80 rounded-lg p-3 border border-cyan-900/60 font-mono text-xs text-cyan-300 overflow-x-auto">
            {module.codeRule}
          </div>
        </div>

        {/* Module Status & Ablation Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                module.active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-mono text-slate-300">
              {module.active !== false ? 'Active in Reasoning Core' : 'Ablated (Dormant)'}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onToggleActive(module.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
              module.active !== false
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900/60'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60'
            }`}
          >
            {module.active !== false ? 'Ablate Module (Disable)' : 'Activate Module'}
          </button>
        </div>
      </div>
    </div>
  );
};
