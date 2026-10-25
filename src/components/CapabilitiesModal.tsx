import React from 'react';
import {
  Mic,
  Brain,
  Globe,
  Globe2,
  Plug,
  Sparkles,
  Zap,
  Split,
  Search,
  CheckCircle,
  X,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface CapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction: (action: 'voice' | 'evolve' | 'ask_capabilities' | 'plugins' | 'vault') => void;
  currentGen: number;
}

export const CapabilitiesModal: React.FC<CapabilitiesModalProps> = ({
  isOpen,
  onClose,
  onTriggerAction,
  currentGen,
}) => {
  if (!isOpen) return null;

  const capabilities = [
    {
      icon: Mic,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/60 border-cyan-800/60',
      title: 'Real-Time Voice & Concurrent Task Execution',
      description:
        'Have a natural spoken voice conversation with Gemini 3.8 Live API while giving and executing tasks in parallel (self-evolution, vault archiving, benchmarks, calculations) without interrupting speech.',
      actionText: 'Launch Live Voice',
      actionKey: 'voice' as const,
    },
    {
      icon: Brain,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/60 border-amber-800/60',
      title: 'Autonomous Recursive Self-Improvement',
      description:
        'Diagnoses its own cognitive fallacies, writes and mutates new heuristic modules, passes formal benchmark challenges, and elevates its Synthetic IQ.',
      actionText: 'Trigger Self-Evolution',
      actionKey: 'evolve' as const,
    },
    {
      icon: Database,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/60 border-purple-800/60',
      title: 'Knowledge Vault & Long-Term Recall',
      description:
        'Visualizes, archives, and recalls key findings, summaries, and directives from previous interactions so J.A.R.V.I.S. can recall learned information in future sessions.',
      actionText: 'Open Knowledge Vault',
      actionKey: 'vault' as const,
    },
    {
      icon: Globe,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/60 border-emerald-800/60',
      title: 'Universal Multilingual Omnilingualism',
      description:
        'Flawlessly understands, translates, and speaks in all world languages (English, Tamil, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, etc.).',
      actionText: 'Ask in Any Language',
      actionKey: 'ask_capabilities' as const,
    },
    {
      icon: Search,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/60 border-indigo-800/60',
      title: 'Google Search Data Grounding',
      description:
        'Retrieves live internet intelligence, verifies frontier scientific papers and recent benchmarks via Gemini 3.5 Flash with live citations.',
      actionText: 'Query Live Grounding',
      actionKey: 'ask_capabilities' as const,
    },
    {
      icon: Plug,
      color: 'text-pink-400',
      bgColor: 'bg-pink-950/60 border-pink-800/60',
      title: 'Universal Subsystems & Plugin Hub',
      description:
        'Plugs in with everything: REST Webhooks, safe Math/Algorithm Sandbox, Hardware Telemetry (Battery/Cores/Zone), Knowledge Vault files, and Long-Term Memory.',
      actionText: 'Open Subsystems Hub',
      actionKey: 'plugins' as const,
    },
    {
      icon: Split,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/60 border-purple-800/60',
      title: 'A/B Dual-Model Contrast Diagnostics',
      description:
        'Empirically contrasts the evolved Gen N model against an un-upgraded Gen 0 baseline to demonstrate reasoning superiority.',
      actionText: 'Test A/B Contrast',
      actionKey: 'ask_capabilities' as const,
    },
    {
      icon: ShieldCheck,
      color: 'text-teal-400',
      bgColor: 'bg-teal-950/60 border-teal-800/60',
      title: 'Operator Security & Permission Gate',
      description:
        'Zero unauthorized external launches: J.A.R.V.I.S. strictly requires manual operator permission before opening any website or app, keeping you in complete control.',
      actionText: 'Operator Guard Active',
      actionKey: 'ask_capabilities' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/50 rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl shadow-cyan-950/80 overflow-hidden relative">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                WHAT J.A.R.V.I.S. CAN DO FOR YOU
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Cognitive Capabilities & Autonomous Subsystems Registry [GEN {currentGen}]
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

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 text-xs text-slate-300 font-sans leading-relaxed">
            <span className="font-mono text-cyan-300 font-bold block mb-1">
              &ldquo;At your service, Sir. I am J.A.R.V.I.S., an autonomous recursively self-improving cognitive assistant.&rdquo;
            </span>
            I combine real-time spoken voice, continuous self-evolution, universal language fluency, live Google Search data, and universal plugin connectivity into a unified Stark-grade neural interface.
          </div>

          {/* Grid of Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition hover:border-cyan-500/60 ${cap.bgColor}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${cap.color}`} />
                      <h3 className="text-xs font-mono font-bold text-slate-100">
                        {cap.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-3">
                      {cap.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onTriggerAction(cap.actionKey);
                      onClose();
                    }}
                    className="w-full py-1.5 px-2 bg-slate-900/80 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 rounded border border-slate-700/80 hover:border-cyan-500 flex items-center justify-center gap-1 transition"
                  >
                    <span>{cap.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Powered by Gemini 3.8 Live, Gemini 3.8 Flash & Gemini 3.5 Flash Grounding
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs font-bold transition"
          >
            Acknowledge Protocols
          </button>
        </div>
      </div>
    </div>
  );
};
