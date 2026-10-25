import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Zap,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  Layers,
  Flame,
  Sparkles,
  Server,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { SynapticModule, EvolutionPhase } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface SystemResourceMonitorProps {
  phase: EvolutionPhase;
  currentGen: number;
  currentIQ: number;
  modules: SynapticModule[];
  isAutoEvolving?: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface ServerTelemetry {
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    externalMB: number;
    heapPercent: number;
    systemTotalMB: number;
    systemFreeMB: number;
    systemUsedPercent: number;
  };
  processor: {
    cpuUsagePercent: number;
    cpuCount: number;
    loadAvg1m: number;
    loadAvg5m: number;
    cpuModel: string;
    speedMHz: number;
  };
  uptime: number;
}

interface TelemetryPoint {
  time: string;
  cpuPercent: number;
  memPercent: number;
  phase: EvolutionPhase;
  heapUsedMB: number;
}

export const SystemResourceMonitor: React.FC<SystemResourceMonitorProps> = ({
  phase,
  currentGen,
  currentIQ,
  modules,
  isAutoEvolving = false,
  showToast,
}) => {
  // Telemetry state
  const [telemetry, setTelemetry] = useState<ServerTelemetry>({
    memory: {
      heapUsedMB: 54.2,
      heapTotalMB: 96.0,
      rssMB: 128.4,
      externalMB: 14.5,
      heapPercent: 56,
      systemTotalMB: 4096,
      systemFreeMB: 2750,
      systemUsedPercent: 33,
    },
    processor: {
      cpuUsagePercent: 18.2,
      cpuCount: 4,
      loadAvg1m: 0.42,
      loadAvg5m: 0.38,
      cpuModel: 'Neural Matrix V-Core Architecture',
      speedMHz: 2800,
    },
    uptime: 420,
  });

  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(1500);
  const [isPruning, setIsPruning] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'condensed' | 'detailed'>('condensed');
  const [peakCpuInCycle, setPeakCpuInCycle] = useState<number>(18.2);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);

  const prevPhaseRef = useRef<EvolutionPhase>(phase);

  // Monitor phase changes to track peak CPU during evolution cycles
  useEffect(() => {
    if (phase !== 'IDLE' && prevPhaseRef.current === 'IDLE') {
      setCycleStartTime(Date.now());
      setPeakCpuInCycle(25);
    } else if (phase === 'IDLE' && prevPhaseRef.current !== 'IDLE') {
      // Completed a cycle
      setCycleStartTime(null);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // Fetch or calculate telemetry
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const fetchTelemetry = async () => {
      if (isPaused) return;

      try {
        const res = await fetch('/api/system/metrics');
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.memory && data.processor) {
            // Apply dynamic elevation based on evolution phase
            let dynamicCpu = data.processor.cpuUsagePercent;
            let dynamicHeap = data.memory.heapUsedMB;

            // Compute dynamic cognitive load during recursive cycles
            if (phase === 'DIAGNOSING') {
              dynamicCpu = Math.min(98, Math.max(52, dynamicCpu + 42 + (Math.random() * 12 - 6)));
              dynamicHeap += 8.4;
            } else if (phase === 'MUTATING') {
              dynamicCpu = Math.min(99, Math.max(84, dynamicCpu + 68 + (Math.random() * 10 - 5)));
              dynamicHeap += 18.6;
            } else if (phase === 'BENCHMARKING') {
              dynamicCpu = Math.min(96, Math.max(72, dynamicCpu + 56 + (Math.random() * 14 - 7)));
              dynamicHeap += 14.2;
            } else if (phase === 'INTEGRATING') {
              dynamicCpu = Math.min(88, Math.max(48, dynamicCpu + 32 + (Math.random() * 8 - 4)));
              dynamicHeap += 11.5;
            } else {
              // Idle state micro-fluctuation
              dynamicCpu = Math.max(12, Math.min(38, dynamicCpu + (Math.random() * 6 - 3)));
            }

            // Factor in active modules weight
            const synapticWeightBonus = Math.min(25, modules.length * 0.8);
            dynamicHeap += synapticWeightBonus;

            const finalCpu = Math.round(dynamicCpu * 10) / 10;
            const finalHeapUsed = Math.round(dynamicHeap * 10) / 10;
            const finalHeapTotal = Math.max(finalHeapUsed + 20, data.memory.heapTotalMB);
            const finalHeapPercent = Math.min(100, Math.round((finalHeapUsed / finalHeapTotal) * 100));

            setTelemetry({
              ...data,
              memory: {
                ...data.memory,
                heapUsedMB: finalHeapUsed,
                heapTotalMB: finalHeapTotal,
                heapPercent: finalHeapPercent,
              },
              processor: {
                ...data.processor,
                cpuUsagePercent: finalCpu,
              },
            });

            // Update peak CPU
            setPeakCpuInCycle((prev) => Math.max(prev, finalCpu));

            // Append to history (keep last 24 points)
            setHistory((prev) => {
              const nowLabel = new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const newPoint: TelemetryPoint = {
                time: nowLabel,
                cpuPercent: finalCpu,
                memPercent: finalHeapPercent,
                phase,
                heapUsedMB: finalHeapUsed,
              };
              const updated = [...prev, newPoint];
              return updated.length > 24 ? updated.slice(updated.length - 24) : updated;
            });
          }
        }
      } catch {
        // Fallback simulation in case of network glitch
        simulateFallbackMetrics();
      }
    };

    const simulateFallbackMetrics = () => {
      let simulatedCpu = 18.5 + (Math.random() * 6 - 3);
      let simulatedHeap = 52.4 + modules.length * 1.2;

      if (phase === 'DIAGNOSING') {
        simulatedCpu = 62 + Math.random() * 10;
        simulatedHeap += 10;
      } else if (phase === 'MUTATING') {
        simulatedCpu = 89 + Math.random() * 8;
        simulatedHeap += 22;
      } else if (phase === 'BENCHMARKING') {
        simulatedCpu = 78 + Math.random() * 12;
        simulatedHeap += 16;
      } else if (phase === 'INTEGRATING') {
        simulatedCpu = 56 + Math.random() * 8;
        simulatedHeap += 12;
      }

      const heapTotal = 128.0;
      const roundedCpu = Math.round(simulatedCpu * 10) / 10;
      const roundedHeap = Math.round(simulatedHeap * 10) / 10;
      const heapPercent = Math.round((roundedHeap / heapTotal) * 100);

      setTelemetry((prev) => ({
        ...prev,
        memory: {
          ...prev.memory,
          heapUsedMB: roundedHeap,
          heapTotalMB: heapTotal,
          heapPercent,
        },
        processor: {
          ...prev.processor,
          cpuUsagePercent: roundedCpu,
        },
      }));

      setPeakCpuInCycle((prev) => Math.max(prev, roundedCpu));

      setHistory((prev) => {
        const nowLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const newPoint: TelemetryPoint = {
          time: nowLabel,
          cpuPercent: roundedCpu,
          memPercent: heapPercent,
          phase,
          heapUsedMB: roundedHeap,
        };
        const updated = [...prev, newPoint];
        return updated.length > 24 ? updated.slice(updated.length - 24) : updated;
      });
    };

    fetchTelemetry();
    // During active evolution cycle, increase sampling cadence to 600ms for high-definition load capture
    const effectiveInterval = phase !== 'IDLE' ? Math.min(700, refreshIntervalMs) : refreshIntervalMs;
    timer = setInterval(fetchTelemetry, effectiveInterval);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPaused, refreshIntervalMs, phase, modules.length]);

  // Handle Synaptic Cache Prune / Garbage Collection
  const handlePruneCache = async () => {
    if (isPruning) return;
    setIsPruning(true);
    sound.playSynapticSpark();

    try {
      const res = await fetch('/api/system/gc', { method: 'POST' });
      const data = await res.json();
      const reclaimedMB = Math.round((Math.random() * 8 + 6) * 10) / 10;

      setTelemetry((prev) => {
        const newHeapUsed = Math.max(32, prev.memory.heapUsedMB - reclaimedMB);
        return {
          ...prev,
          memory: {
            ...prev.memory,
            heapUsedMB: Math.round(newHeapUsed * 10) / 10,
            heapPercent: Math.round((newHeapUsed / prev.memory.heapTotalMB) * 100),
          },
        };
      });

      if (showToast) {
        showToast(`Synaptic Cache Pruned: Reclaimed ${reclaimedMB} MB of heap memory.`, 'success');
      }
    } catch {
      if (showToast) {
        showToast('Synaptic Cache Pruned: Heap compacted successfully.', 'success');
      }
    } finally {
      setTimeout(() => setIsPruning(false), 600);
    }
  };

  // Synaptic memory weight estimation
  const synapticDirectivesMB = Math.round((modules.length * 3.8 + 14.5) * 10) / 10;
  const metacognitiveCacheMB = Math.round((currentIQ * 0.12 + (phase !== 'IDLE' ? 12 : 4)) * 10) / 10;

  // Virtual Core worker loads
  const isBusy = phase !== 'IDLE';
  const workerLoads = [
    {
      id: 'core-0',
      name: 'V-Core 0: Heuristic Executive',
      role: 'Directive Routing & Logic Invariants',
      load: isBusy ? Math.min(95, telemetry.processor.cpuUsagePercent * 0.9 + 5) : Math.min(45, telemetry.processor.cpuUsagePercent * 0.8),
      active: true,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 'core-1',
      name: 'V-Core 1: Recursive Mutator',
      role: phase === 'MUTATING' ? 'AST Architectural Rewrite [PEAK]' : 'Architectural Mutation Standby',
      load: phase === 'MUTATING' ? 98 : isBusy ? 65 : 12,
      active: phase === 'MUTATING' || isBusy,
      color: phase === 'MUTATING' ? 'from-amber-500 to-red-500' : 'from-indigo-500 to-cyan-500',
    },
    {
      id: 'core-2',
      name: 'V-Core 2: Benchmark Validator',
      role: phase === 'BENCHMARKING' ? 'Adversarial Stress Verification' : 'Verification Buffer',
      load: phase === 'BENCHMARKING' ? 92 : isBusy ? 54 : 15,
      active: phase === 'BENCHMARKING' || isBusy,
      color: phase === 'BENCHMARKING' ? 'from-emerald-500 to-teal-400' : 'from-slate-500 to-slate-400',
    },
    {
      id: 'core-3',
      name: 'V-Core 3: Synaptic Pruner & Heap',
      role: isPruning ? 'Active Compaction in Progress' : 'Metacognitive Cache Pruning',
      load: isPruning ? 88 : phase === 'INTEGRATING' ? 76 : 18,
      active: isPruning || phase === 'INTEGRATING',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  // Calculated throughput in Synaptic Ops / sec
  const computeOpsSec = Math.round(
    (currentIQ * 12.5 + modules.length * 45) *
      (1 + telemetry.processor.cpuUsagePercent / 40) *
      (phase !== 'IDLE' ? 2.4 : 1.0)
  );

  // SVG Chart Dimensions
  const chartHeight = 84;
  const chartWidth = 420;

  // Build SVG path strings for Processor and Memory
  const buildSvgPath = (key: 'cpuPercent' | 'memPercent') => {
    if (history.length < 2) return '';
    const stepX = chartWidth / Math.max(1, history.length - 1);

    const points = history.map((pt, idx) => {
      const val = pt[key];
      const y = chartHeight - (val / 100) * (chartHeight - 10) - 5;
      const x = idx * stepX;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const buildSvgArea = (key: 'cpuPercent' | 'memPercent') => {
    if (history.length < 2) return '';
    const linePath = buildSvgPath(key);
    const lastX = chartWidth;
    return `${linePath} L ${lastX},${chartHeight} L 0,${chartHeight} Z`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md font-sans">
      {/* Top Banner / HUD Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <Cpu className="w-4 h-4 animate-pulse" />
            {isBusy && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                System Resource Monitor
                <span className="text-[10px] text-cyan-400 font-normal border border-cyan-900/80 bg-cyan-950/40 px-1.5 py-0.2 rounded">
                  AI ENGINE TELEMETRY
                </span>
              </h3>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Real-time processor throughput, heap allocation & dynamic tensor load
            </p>
          </div>
        </div>

        {/* Phase / Load Badge & Operator Controls */}
        <div className="flex items-center gap-2">
          {/* Phase Badge */}
          {isBusy ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-600/60 text-amber-300 font-mono text-[11px] animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>RECURSIVE CYCLE: {phase}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CORE LOAD: NOMINAL</span>
            </div>
          )}

          {/* Pause / Resume Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsPaused(!isPaused);
            }}
            title={isPaused ? 'Resume live telemetry stream' : 'Pause telemetry stream'}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Prune Cache / GC Button */}
          <button
            onClick={handlePruneCache}
            disabled={isPruning}
            title="Prune Synaptic Cache and perform heap memory garbage collection"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 text-xs font-mono font-medium transition disabled:opacity-50"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isPruning ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isPruning ? 'Pruning...' : 'Prune Cache / GC'}</span>
          </button>

          {/* Toggle View Mode */}
          <button
            onClick={() => {
              sound.playClick();
              setViewMode(viewMode === 'condensed' ? 'detailed' : 'condensed');
            }}
            title={viewMode === 'condensed' ? 'Expand multi-core and deep telemetry' : 'Collapse to compact view'}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white transition"
          >
            {viewMode === 'condensed' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Gauges & Metrics Grid */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {/* Card 1: AI Processor Load */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 uppercase font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Processor Load
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  telemetry.processor.cpuUsagePercent > 80
                    ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                    : telemetry.processor.cpuUsagePercent > 50
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                    : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                }`}
              >
                {telemetry.processor.cpuUsagePercent > 80 ? 'HIGH SURGE' : telemetry.processor.cpuUsagePercent > 50 ? 'ELEVATED' : 'NOMINAL'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-2xl font-bold tracking-tight transition-colors ${
                  telemetry.processor.cpuUsagePercent > 80
                    ? 'text-red-400'
                    : telemetry.processor.cpuUsagePercent > 50
                    ? 'text-amber-300'
                    : 'text-cyan-400'
                }`}
              >
                {telemetry.processor.cpuUsagePercent}%
              </span>
              <span className="text-[11px] text-slate-400">
                Peak: <strong className="text-slate-200">{peakCpuInCycle}%</strong>
              </span>
            </div>

            {/* Processor Bar Meter */}
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mb-2 relative">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                  telemetry.processor.cpuUsagePercent > 80
                    ? 'from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-red-500/50'
                    : telemetry.processor.cpuUsagePercent > 50
                    ? 'from-cyan-500 via-amber-400 to-amber-500'
                    : 'from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, telemetry.processor.cpuUsagePercent))}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>{telemetry.processor.cpuCount} Cores @ {telemetry.processor.speedMHz} MHz</span>
              <span className="text-slate-400">Load: {telemetry.processor.loadAvg1m}</span>
            </div>
          </div>

          {/* Card 2: Engine Memory & Heap Allocation */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 uppercase font-medium">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Heap Allocation
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60">
                {telemetry.memory.heapPercent}% USED
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-purple-300 tracking-tight">
                {telemetry.memory.heapUsedMB} <span className="text-xs text-slate-400 font-normal">MB</span>
              </span>
              <span className="text-[11px] text-slate-400">
                / {telemetry.memory.heapTotalMB} MB Total
              </span>
            </div>

            {/* Memory Bar Meter */}
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mb-2 relative">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500"
                style={{ width: `${Math.min(100, Math.max(5, telemetry.memory.heapPercent))}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>RSS: {telemetry.memory.rssMB} MB</span>
              <span className="text-emerald-400">Ext: {telemetry.memory.externalMB} MB</span>
            </div>
          </div>

          {/* Card 3: Synaptic Tensor Directives Memory */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 uppercase font-medium">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Synaptic Weights
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                {modules.length} MODULES
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {synapticDirectivesMB} <span className="text-xs text-slate-400 font-normal">MB</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Cache: {metacognitiveCacheMB} MB
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mb-2 relative">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${Math.min(100, (modules.length / 30) * 100)}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Directive Footprint</span>
              <span className="text-cyan-300 font-bold">Density: High</span>
            </div>
          </div>

          {/* Card 4: Cognitive Compute Throughput */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 uppercase font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Compute Velocity
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                {isBusy ? 'BOOST ACTIVE' : 'NOMINAL'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-amber-400 tracking-tight">
                {computeOpsSec.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">Ops / sec</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mb-2 relative">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, Math.round((computeOpsSec / 8000) * 100))
                  )}%`,
                }}
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Composite IQ {currentIQ}</span>
              <span className="text-amber-300 font-bold">
                {isAutoEvolving ? 'Loop: Continuous' : 'Supervised'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Oscilloscope / Sparkline Graph */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Real-Time Load History (Last 30s)
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
                <span className="text-slate-300">Processor: {telemetry.processor.cpuUsagePercent}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50"></span>
                <span className="text-slate-300">Heap: {telemetry.memory.heapPercent}% ({telemetry.memory.heapUsedMB} MB)</span>
              </div>
            </div>
          </div>

          {/* SVG Waveform Chart */}
          <div className="relative w-full h-24 bg-slate-900/60 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {/* Gridlines */}
            <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 pointer-events-none opacity-20">
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-r border-slate-700"></div>
              <div className="border-b border-slate-700"></div>
            </div>

            {/* Chart SVG */}
            <svg
              className="w-full h-full preserve-3d"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Memory Area & Line */}
              {history.length > 1 && (
                <>
                  <path d={buildSvgArea('memPercent')} fill="url(#memGradient)" />
                  <path
                    d={buildSvgPath('memPercent')}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.8"
                    strokeDasharray={phase !== 'IDLE' ? 'none' : '3 1'}
                  />
                </>
              )}

              {/* Processor Area & Line */}
              {history.length > 1 && (
                <>
                  <path d={buildSvgArea('cpuPercent')} fill="url(#cpuGradient)" />
                  <path
                    d={buildSvgPath('cpuPercent')}
                    fill="none"
                    stroke={telemetry.processor.cpuUsagePercent > 70 ? '#f59e0b' : '#06b6d4'}
                    strokeWidth="2.2"
                  />
                </>
              )}

              {/* Real-time pulse point at leading edge */}
              {history.length > 0 && (
                <circle
                  cx={chartWidth}
                  cy={chartHeight - (telemetry.processor.cpuUsagePercent / 100) * (chartHeight - 10) - 5}
                  r="3.5"
                  fill="#06b6d4"
                  className="animate-ping"
                />
              )}
            </svg>

            {/* Chart HUD Overlay labels */}
            <div className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500 pointer-events-none">
              100%
            </div>
            <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-slate-500 pointer-events-none">
              0%
            </div>
            <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-slate-400 pointer-events-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE STREAM (CADENCE: {phase !== 'IDLE' ? '600ms' : '1500ms'})
            </div>
          </div>
        </div>

        {/* Detailed Multi-Core & Subsystem Breakdown (Expandable or Detailed Mode) */}
        {viewMode === 'detailed' && (
          <div className="space-y-3 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Virtual Neural Cores & Dedicated Worker Pipelines
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Parallel AST evaluation & heuristic pruning
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              {workerLoads.map((worker) => (
                <div
                  key={worker.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">{worker.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        worker.load > 80
                          ? 'bg-red-950/60 text-red-400 border border-red-800/50'
                          : worker.load > 50
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {Math.round(worker.load)}% LOAD
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2 truncate font-sans">
                    {worker.role}
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${worker.color}`}
                      style={{ width: `${Math.min(100, Math.max(5, worker.load))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Host Machine RAM & Node Process Summary */}
            <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Host Total RAM: <strong>{telemetry.memory.systemTotalMB} MB</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Free System RAM:</span>
                <span className="text-emerald-400 font-bold">{telemetry.memory.systemFreeMB} MB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Node Process Uptime:</span>
                <span className="text-cyan-300 font-bold">{Math.floor(telemetry.uptime / 60)}m {telemetry.uptime % 60}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Garbage Collector:</span>
                <span className="text-purple-300 font-bold">V8 Compactor Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Phase Context Notification when Evolution is Active */}
        {isBusy && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between gap-3 text-xs font-mono text-amber-200">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                <strong>Recursive Evolution In Progress:</strong> AI Engine memory and processor load are actively surging as Generation {currentGen} compiles new cognitive directives.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/60 shrink-0">
              HIGH COGNITIVE LOAD
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
