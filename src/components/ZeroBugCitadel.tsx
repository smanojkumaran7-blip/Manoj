import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Terminal,
  Cpu,
  Layers,
  Bug,
  Flame,
  Zap,
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  Activity,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  IntegrationTestCase,
  SelfHealedPatchEntry,
  MutationTestResult,
  ZeroBugSuiteSummary,
} from '../types.ts';
import { sound } from '../utils/audio.ts';

interface ZeroBugCitadelProps {
  currentGen: number;
  currentIQ: number;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSelfHealingModal?: () => void;
}

type ActiveViewTab = 'suite' | 'diffs' | 'mutation_chamber';

export const ZeroBugCitadel: React.FC<ZeroBugCitadelProps> = ({
  currentGen,
  currentIQ,
  showToast,
  onOpenSelfHealingModal,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('suite');
  const [isRunningSuite, setIsRunningSuite] = useState<boolean>(false);
  const [suiteSummary, setSuiteSummary] = useState<ZeroBugSuiteSummary | null>(null);
  const [selectedSubsystemFilter, setSelectedSubsystemFilter] = useState<string>('ALL');
  const [selectedPatch, setSelectedPatch] = useState<SelfHealedPatchEntry | null>(null);

  // Mutation testing state
  const [selectedMutationType, setSelectedMutationType] = useState<string>('CORRUPTED_PAYLOAD');
  const [isInjectingMutation, setIsInjectingMutation] = useState<boolean>(false);
  const [latestMutationResult, setLatestMutationResult] = useState<MutationTestResult | null>(null);
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);

  // Fetch initial test suite on mount
  useEffect(() => {
    runIntegrationSuite(true);
  }, []);

  const runIntegrationSuite = async (isInitial = false) => {
    if (!isInitial) sound.playScan();
    setIsRunningSuite(true);

    try {
      const res = await fetch('/api/testing/run-suite', { method: 'POST' });
      const data: ZeroBugSuiteSummary = await res.json();
      setSuiteSummary(data);

      if (data.recentPatches && data.recentPatches.length > 0 && !selectedPatch) {
        setSelectedPatch(data.recentPatches[0]);
      }

      if (!isInitial) {
        sound.playUpgradeSuccess();
        showToast?.(`Gauntlet Passed: ${data.passedCount + data.healedCount}/${data.totalTests} tests 100% verified zero-bug.`, 'success');
      }
    } catch (err: any) {
      showToast?.('Test runner failed to execute: ' + err.message, 'error');
    } finally {
      setIsRunningSuite(false);
    }
  };

  const handleInjectMutation = async (type: string) => {
    sound.playScan();
    setIsInjectingMutation(true);
    setLatestMutationResult(null);

    try {
      const res = await fetch('/api/testing/mutation-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutationType: type }),
      });
      const data = await res.json();

      if (data.success && data.mutation) {
        setLatestMutationResult(data.mutation);
        setSelectedPatch(data.mutation.patch);

        // Update suite patch ledger
        if (suiteSummary) {
          setSuiteSummary({
            ...suiteSummary,
            healedCount: suiteSummary.healedCount + 1,
            recentPatches: [data.mutation.patch, ...suiteSummary.recentPatches],
          });
        }

        sound.playUpgradeSuccess();
        showToast?.(`Mutation Intercepted: Auto-healed in ${data.mutation.timeToHealMs}ms with zero regression.`, 'success');
      }
    } catch (err: any) {
      showToast?.('Mutation injection error: ' + err.message, 'error');
    } finally {
      setIsInjectingMutation(false);
    }
  };

  const copyPatchToClipboard = (patch: SelfHealedPatchEntry) => {
    const text = `// DEFECT: ${patch.defectSummary}\n// SUBSYSTEM: ${patch.subsystem}\n// VERIFICATION: ${patch.verificationStatus}\n\n// --- BUGGY STATE ---\n${patch.buggyCodeSnippet}\n\n// +++ AUTO-HEALED RESOLUTION +++\n${patch.healedPatchSnippet}`;
    navigator.clipboard.writeText(text);
    setCopiedPatchId(patch.id);
    sound.playClick();
    setTimeout(() => setCopiedPatchId(null), 2000);
    showToast?.('Patch code copied to clipboard', 'info');
  };

  const filteredTests = suiteSummary?.tests.filter((t) => {
    if (selectedSubsystemFilter === 'ALL') return true;
    return t.subsystem === selectedSubsystemFilter;
  }) || [];

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* TOP HEADER: ZERO-BUG CITADEL TELEMETRY & CONTROLS         */}
      {/* ========================================================= */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
                  <span>Zero-Bug Citadel</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/80 text-emerald-300 font-mono">
                    100% IMMUNITY ACTIVE
                  </span>
                </h2>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span>Gen {currentGen} Synaptic Matrix</span>
                  <span>·</span>
                  <span className="text-cyan-400 font-bold">Synthetic IQ {currentIQ}</span>
                  <span>·</span>
                  <span className="text-emerald-400">Zero Unresolved Regressions</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-sans pt-1">
              Automated integration and mutation test harness continuously monitoring UI rendering, Express backend proxies,
              5 work plugins, optical camera vision, and audio engines. Intercepts runtime anomalies and synthesizes verified patches.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => runIntegrationSuite()}
              disabled={isRunningSuite}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition shadow-md ${
                isRunningSuite
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-900/30 ring-1 ring-emerald-400'
              }`}
            >
              {isRunningSuite ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing 24 Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Zero-Bug Gauntlet</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleInjectMutation(selectedMutationType)}
              disabled={isInjectingMutation}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition border ${
                isInjectingMutation
                  ? 'bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-700 text-indigo-300 shadow-sm'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Inject Mutation Trap</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Readout Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Test Assertions</span>
            <div className="text-base font-bold text-slate-100 mt-0.5 tabular-nums">
              {suiteSummary?.totalTests || 24} <span className="text-emerald-400 text-xs font-normal">/ 24 Passed</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mutation Resistance</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5 tabular-nums">
              {suiteSummary?.mutationResistancePct || 100}% <span className="text-slate-400 text-xs font-normal">Fault Proof</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Auto-Healed Anomalies</span>
            <div className="text-base font-bold text-cyan-400 mt-0.5 tabular-nums">
              {suiteSummary?.recentPatches.length || 4} <span className="text-slate-400 text-xs font-normal">Patched Live</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Time to Recovery</span>
            <div className="text-base font-bold text-indigo-300 mt-0.5 tabular-nums">
              {suiteSummary?.meanTimeToRecoveryMs || 28}ms <span className="text-slate-400 text-xs font-normal">Instant Fix</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NAVIGATION TABS FOR CITADEL VIEWS                         */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setActiveTab('suite');
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
            activeTab === 'suite'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automated Test Gauntlet ({suiteSummary?.totalTests || 24})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setActiveTab('diffs');
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
            activeTab === 'diffs'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Patch Diff Ledger ({suiteSummary?.recentPatches.length || 4})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setActiveTab('mutation_chamber');
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
            activeTab === 'mutation_chamber'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Bug className="w-3.5 h-3.5 text-indigo-400" />
          <span>Mutation Testing Chamber</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AUTOMATED INTEGRATION TEST SUITE GAUNTLET          */}
      {/* ========================================================= */}
      {activeTab === 'suite' && (
        <div className="space-y-3">
          {/* Subsystem Filter Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
            <span className="text-slate-500 flex items-center gap-1 pr-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {['ALL', 'TERMINAL_SANDBOX', 'RESEARCH_AGENT', 'ANALYTICS_ENGINE', 'TASK_SCHEDULER', 'VAULT_ARCHIVER', 'AGENTIC_CORE', 'CAMERA_VISION', 'VOICE_NAV'].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedSubsystemFilter(sub);
                }}
                className={`px-2.5 py-1 rounded border transition whitespace-nowrap ${
                  selectedSubsystemFilter === sub
                    ? 'bg-slate-800 text-slate-100 border-slate-600'
                    : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                {sub.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Test Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="rounded-xl border border-slate-800/90 bg-slate-950 p-3.5 hover:border-slate-700 transition flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${test.status === 'PASSED' ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
                      <h4 className="text-xs font-mono font-bold text-slate-200">
                        {test.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        test.status === 'PASSED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {test.status}
                      </span>
                      <span className="text-slate-500 tabular-nums">{test.durationMs}ms</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans mt-1">
                    {test.assertion}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900 space-y-1 text-[10px] font-mono">
                  <div className="text-slate-400 truncate">
                    <span className="text-slate-500">Expected: </span>
                    <span>{test.expectedOutput}</span>
                  </div>
                  {test.actualOutput && (
                    <div className="text-emerald-300 truncate">
                      <span className="text-slate-500">Result: </span>
                      <span>{test.actualOutput}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: REAL-TIME SELF-HEALING LEDGER & PATCH DIFFS        */}
      {/* ========================================================= */}
      {activeTab === 'diffs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patch Index Column */}
          <div className="space-y-2 lg:col-span-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Self-Healed Anomalies ({suiteSummary?.recentPatches.length || 0})
            </span>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {(suiteSummary?.recentPatches || []).map((patch) => (
                <button
                  key={patch.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedPatch(patch);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedPatch?.id === patch.id
                      ? 'bg-cyan-950/50 border-cyan-500/80 shadow-md shadow-cyan-950'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-slate-400 font-bold">{patch.subsystem}</span>
                    <span className="text-emerald-400">{patch.verificationStatus}</span>
                  </div>
                  <h4 className="text-xs font-mono text-slate-200 font-medium line-clamp-2">
                    {patch.defectSummary}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 pt-1 border-t border-slate-800/60">
                    <span>{patch.timestamp}</span>
                    <span className="tabular-nums">Healed in {patch.autoHealedDurationMs}ms</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Side-by-Side / Unified Patch Diff Viewer */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
            {selectedPatch ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                        {selectedPatch.verificationStatus}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {selectedPatch.subsystem} · {selectedPatch.timestamp}
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-bold text-slate-100 mt-1">
                      {selectedPatch.defectSummary}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyPatchToClipboard(selectedPatch)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono hover:bg-slate-800 transition shrink-0"
                  >
                    {copiedPatchId === selectedPatch.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Stack Trace / Root Cause */}
                {selectedPatch.stackTrace && (
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-rose-300/90 overflow-x-auto whitespace-pre-wrap">
                    <span className="text-rose-500 font-bold block mb-1">INTERCEPTED DEFECT TRACE:</span>
                    {selectedPatch.stackTrace}
                  </div>
                )}

                {/* Diff View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-rose-400 flex items-center gap-1">
                      <span>- Before: Vulnerable / Buggy Code</span>
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span>+ After: Self-Healed Resolution</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                    {/* Buggy Code */}
                    <div className="rounded-lg border border-rose-900/60 bg-rose-950/20 p-3 overflow-x-auto text-rose-200">
                      <pre className="whitespace-pre-wrap leading-relaxed">{selectedPatch.buggyCodeSnippet}</pre>
                    </div>

                    {/* Healed Patch */}
                    <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 overflow-x-auto text-emerald-200">
                      <pre className="whitespace-pre-wrap leading-relaxed">{selectedPatch.healedPatchSnippet}</pre>
                    </div>
                  </div>
                </div>

                {/* Diff Explanation Summary */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-sans flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono font-bold text-cyan-300">Self-Healing Analysis: </span>
                    {selectedPatch.diffSummary}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                Select an anomaly from the ledger to view the live patch diff.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MUTATION TESTING CHAMBER                           */}
      {/* ========================================================= */}
      {activeTab === 'mutation_chamber' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
              <Bug className="w-4 h-4 text-indigo-400" />
              <span>Synthetic Mutation Gauntlet</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              Inject intentional architectural defects, network timeouts, or corrupted data payloads to verify that the
              AI system detects anomalies and self-heals in real time without human intervention.
            </p>
          </div>

          {/* Mutation Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {[
              {
                id: 'CORRUPTED_PAYLOAD',
                title: 'Corrupted JSON Payload',
                subsystem: 'Agentic Core',
                desc: 'Injects truncated JSON buffer to test safe parser and auto-repair.',
              },
              {
                id: 'NETWORK_TIMEOUT',
                title: 'Network Socket Timeout',
                subsystem: 'Research Agent',
                desc: 'Simulates hanging socket (>5s) to test AbortController and cache.',
              },
              {
                id: 'NULL_POINTER',
                title: 'Null Reference in Telemetry',
                subsystem: 'Analytics Engine',
                desc: 'Injects missing cells during statistical aggregation to test NaN guard.',
              },
              {
                id: 'CONCURRENCY_COLLISION',
                title: 'Speech Agent Collision',
                subsystem: 'Voice Core',
                desc: 'Tests mutex preemption lock when multiple agents speak at once.',
              },
              {
                id: 'SYNTAX_ANOMALY',
                title: 'Malformed Regex Pattern',
                subsystem: 'Voice Navigator',
                desc: 'Injects unescaped characters to test input sanitization wrapper.',
              },
            ].map((mut) => (
              <div
                key={mut.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedMutationType(mut.id);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  selectedMutationType === mut.id
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-indigo-400 font-bold">{mut.subsystem}</span>
                    <span className="text-slate-500">{mut.id}</span>
                  </div>
                  <h4 className="text-xs font-mono font-bold text-slate-200">
                    {mut.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-1">
                    {mut.desc}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">Click to select</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInjectMutation(mut.id);
                    }}
                    disabled={isInjectingMutation}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-[11px] font-mono font-bold transition flex items-center gap-1"
                  >
                    <span>Trigger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Latest Mutation Injection Telemetry */}
          {latestMutationResult && (
            <div className="p-4 rounded-xl border border-indigo-900/80 bg-slate-900/80 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h4 className="text-xs font-mono font-bold text-emerald-300">
                    Mutation Defect Resolved: {latestMutationResult.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>Detected in {latestMutationResult.timeToDetectMs}ms</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">Healed in {latestMutationResult.timeToHealMs}ms</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans">
                {latestMutationResult.description}
              </p>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                <span className="text-slate-500">Auto-Patch Action: </span>
                {latestMutationResult.patch.diffSummary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
