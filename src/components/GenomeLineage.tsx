import React, { useState, useMemo } from 'react';
import { EvolutionGeneration, SynapticModule, CognitiveDimension } from '../types.ts';
import {
  GitCommit,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  FileCode,
  Sparkles,
  Quote,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Activity,
  Layers,
  BarChart3,
  Radar as RadarIcon,
  Crosshair,
  Award,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { sound } from '../utils/audio.ts';

interface GenomeLineageProps {
  generations: EvolutionGeneration[];
  modules: SynapticModule[];
  currentGen: number;
  currentIQ?: number;
  dimensions?: CognitiveDimension[];
}

type ChartViewMode = 'combined' | 'iq' | 'dimensions' | 'radar';

export const GenomeLineage: React.FC<GenomeLineageProps> = ({
  generations,
  modules,
  currentGen,
  currentIQ,
  dimensions = [],
}) => {
  const [showPromptDNA, setShowPromptDNA] = useState(false);
  const [expandedGen, setExpandedGen] = useState<number | null>(null);
  const [chartView, setChartView] = useState<ChartViewMode>('combined');

  // Dimension filter toggles for the multi-line chart
  const [activeDimensionFilters, setActiveDimensionFilters] = useState<Record<string, boolean>>({
    logic: true,
    epistemic: true,
    abstraction: true,
    synthesis: true,
    recursive: true,
    efficiency: true,
  });

  const effectiveCurrentIQ = currentIQ ?? generations[generations.length - 1]?.iqScore ?? 100;

  // Dimension configuration mapping
  const dimensionMeta: Record<string, { label: string; color: string; shortName: string }> = {
    logic: { label: 'Analytical & Formal Logic', color: '#06b6d4', shortName: 'Logic' },
    epistemic: { label: 'Epistemic Self-Calibration', color: '#10b981', shortName: 'Epistemic' },
    abstraction: { label: 'Lateral Abstraction & Analogy', color: '#a855f7', shortName: 'Abstraction' },
    synthesis: { label: 'Complex System Synthesis', color: '#ec4899', shortName: 'Synthesis' },
    recursive: { label: 'Metacognitive Self-Evolution', color: '#f59e0b', shortName: 'Recursive' },
    efficiency: { label: 'Algorithmic Pruning & Clarity', color: '#3b82f6', shortName: 'Efficiency' },
  };

  // Compile active system genome prompt
  const compiledDNA = `// === OMNIEVOLVE ACTIVE RECURSIVE ARCHITECTURE (GEN ${currentGen}) ===
// Generated autonomously via recursive self-improvement cycles
// System IQ: ${effectiveCurrentIQ} | Active Synaptic Synapses: ${modules.length}

${modules
  .map(
    (m, idx) => `// [SYNAPSE ${idx + 1}: ${m.name.toUpperCase()}] (Potency: ${m.potency}%)
// Origin: Gen ${m.generationIntroduced} | Category: ${m.category}
${m.codeRule}
`
  )
  .join('\n')}
// === END SYNAPTIC REGISTRY ===`;

  const toggleExpand = (gen: number) => {
    sound.playClick();
    setExpandedGen((prev) => (prev === gen ? null : gen));
  };

  const toggleDimensionFilter = (dimKey: string) => {
    sound.playClick();
    setActiveDimensionFilters((prev) => ({
      ...prev,
      [dimKey]: !prev[dimKey],
    }));
  };

  // Prepare chronological progression dataset for Recharts
  const progressionData = useMemo(() => {
    const dataPoints: Array<{
      gen: number;
      label: string;
      shortLabel: string;
      iq: number;
      deltaIQ: number;
      module: string;
      timestamp: string;
      logic: number;
      epistemic: number;
      abstraction: number;
      synthesis: number;
      recursive: number;
      efficiency: number;
      diagnosticWeakness?: string;
      [key: string]: string | number | undefined;
    }> = [];

    // Prepend foundational pre-evolution baseline (Gen 0) to highlight initial mutation if starts at Gen 1
    if (generations.length > 0 && generations[0].gen === 1) {
      dataPoints.push({
        gen: 0,
        label: 'Gen 0 (Pre-Awakening)',
        shortLabel: 'G0 (Base)',
        iq: 94,
        deltaIQ: 0,
        module: 'Standard Foundation Baseline',
        timestamp: 'T-0 Pre-Awakening',
        logic: 96,
        epistemic: 88,
        abstraction: 92,
        synthesis: 88,
        recursive: 80,
        efficiency: 94,
        diagnosticWeakness: 'Uncalibrated baseline priors',
      });
    }

    generations.forEach((g) => {
      const dimScores = g.dimensionScores || {};
      dataPoints.push({
        gen: g.gen,
        label: `Gen ${g.gen}`,
        shortLabel: `G${g.gen}`,
        iq: g.iqScore,
        deltaIQ: g.deltaIQ,
        module: g.upgrade?.moduleName || 'Genesis Synapse',
        timestamp: g.timestamp,
        logic: dimScores.logic ?? 102,
        epistemic: dimScores.epistemic ?? 95,
        abstraction: dimScores.abstraction ?? 98,
        synthesis: dimScores.synthesis ?? 94,
        recursive: dimScores.recursive ?? 90,
        efficiency: dimScores.efficiency ?? 100,
        diagnosticWeakness: g.diagnostic?.weaknessFound,
      });
    });

    return dataPoints;
  }, [generations]);

  // Prepare Radar capability data comparing Genesis (Gen 1) vs Current state
  const radarData = useMemo(() => {
    const genesisGen = generations[0];
    const latestGen = generations[generations.length - 1];

    const keys = ['logic', 'epistemic', 'abstraction', 'synthesis', 'recursive', 'efficiency'];

    return keys.map((key) => {
      const meta = dimensionMeta[key];
      const genesisScore = genesisGen?.dimensionScores?.[key] ?? 95;
      const dimLive = dimensions.find((d) => d.id === key);
      const currentScore = dimLive?.score ?? latestGen?.dimensionScores?.[key] ?? genesisScore;

      return {
        dimension: meta ? meta.shortName : key,
        fullName: meta ? meta.label : key,
        genesis: genesisScore,
        current: currentScore,
        maxScore: 240,
      };
    });
  }, [generations, dimensions]);

  // Compute summary stats
  const totalGain = effectiveCurrentIQ - (progressionData[0]?.iq ?? 100);
  const avgVelocity =
    generations.length > 0
      ? (
          generations.reduce((acc, g) => acc + (g.deltaIQ || 0), 0) /
          Math.max(1, generations.length)
        ).toFixed(1)
      : '0.0';

  // Find top progressing dimension
  const topDimension = useMemo(() => {
    if (!dimensions || dimensions.length === 0) return { name: 'Formal Logic', score: 102 };
    return [...dimensions].sort((a, b) => b.score - a.score)[0];
  }, [dimensions]);

  // Custom cybernetic Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-slate-950/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[240px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
              {label || dataPoint?.label}
            </span>
            <span className="text-[10px] text-slate-400">{dataPoint?.timestamp}</span>
          </div>

          <div className="mb-2 bg-slate-900/90 rounded-lg p-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                Current IQ:
              </span>
              <span className="text-amber-300 font-bold text-sm">
                {dataPoint?.iq}{' '}
                {dataPoint?.deltaIQ > 0 && (
                  <span className="text-emerald-400 text-[11px] font-normal">
                    (+{dataPoint?.deltaIQ})
                  </span>
                )}
              </span>
            </div>
            {dataPoint?.module && (
              <div className="text-[10px] text-cyan-400 truncate mt-1">
                Synapse: <span className="text-slate-200">{dataPoint?.module}</span>
              </div>
            )}
          </div>

          {/* Dimension Scores Breakdown */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Cognitive Dimensions:
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              {Object.entries(dimensionMeta).map(([key, meta]) => {
                const score = dataPoint?.[key];
                if (score === undefined) return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-300">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.shortName}:
                    </span>
                    <span className="font-bold" style={{ color: meta.color }}>
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Active DNA Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
        <div>
          <h2 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            RECURSIVE EVOLUTION LINEAGE ({generations.length} EPOCHS)
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time biometric trajectory tracking currentIQ and cognitiveDimension expansion across generational cycles.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setShowPromptDNA(!showPromptDNA);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 text-xs font-mono hover:bg-indigo-900/60 transition"
        >
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showPromptDNA ? 'Hide Compiled DNA' : 'Inspect Active Genome DNA'}</span>
        </button>
      </div>

      {/* Quick Evolution Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-amber-400" /> Current Intelligence
          </div>
          <div className="text-lg font-bold text-amber-300 flex items-baseline gap-1.5">
            IQ {effectiveCurrentIQ}
            <span className="text-xs text-emerald-400 font-normal">
              +{totalGain > 0 ? totalGain : 0} net
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Epoch Gen {currentGen} active
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" /> Evolution Velocity
          </div>
          <div className="text-lg font-bold text-cyan-400">
            +{avgVelocity} IQ / Gen
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Monotonic heuristic growth
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Award className="w-3 h-3 text-emerald-400" /> Peak Dimension
          </div>
          <div className="text-lg font-bold text-emerald-300 truncate">
            {topDimension?.name ? topDimension.name.split('&')[0].trim() : 'Logic'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Score: {topDimension?.score ?? 102} pts
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-3 h-3 text-purple-400" /> Active Synapses
          </div>
          <div className="text-lg font-bold text-purple-300">
            {modules.length} Modules
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            0 regressions observed
          </div>
        </div>
      </div>

      {/* Main Recharts Evolutionary Visualization Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        {/* Chart View Selection Tabs & Dimension Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase text-slate-100">
              Generational Progression Visualizer
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              RECHARTS TELEMETRY
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                sound.playClick();
                setChartView('combined');
              }}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                chartView === 'combined'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Unified Trajectory</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setChartView('iq');
              }}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                chartView === 'iq'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>IQ Velocity</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setChartView('dimensions');
              }}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                chartView === 'dimensions'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-purple-400" />
              <span>Dimensions Matrix</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setChartView('radar');
              }}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                chartView === 'radar'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RadarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Radial Delta</span>
            </button>
          </div>
        </div>

        {/* Dimension Multi-Select Filter Bar (Active in Combined and Dimensions Views) */}
        {(chartView === 'combined' || chartView === 'dimensions') && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs font-mono">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3 h-3 text-slate-500" />
              Dimensions:
            </span>
            {Object.entries(dimensionMeta).map(([key, meta]) => {
              const active = activeDimensionFilters[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleDimensionFilter(key)}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5 transition border ${
                    active
                      ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-sm'
                      : 'bg-transparent border-transparent text-slate-500 opacity-50 hover:opacity-80'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.shortName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Render Recharts Viewport */}
        <div className="w-full h-80 sm:h-96">
          {/* VIEW 1: COMBINED TRAJECTORY (IQ Area + Dimension Lines) */}
          {chartView === 'combined' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progressionData}
                margin={{ top: 15, right: 25, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="iqGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  domain={['dataMin - 10', 'dataMax + 15']}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <ReferenceLine
                  y={100}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Base 100',
                    fill: '#64748b',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />

                {/* Primary IQ Evolution Area */}
                <Area
                  type="monotone"
                  dataKey="iq"
                  name="Current IQ"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#iqGradient)"
                  dot={{ r: 4, fill: '#0891b2', stroke: '#22d3ee', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                />

                {/* Cognitive Dimensions Lines */}
                {Object.entries(dimensionMeta).map(([key, meta]) => {
                  if (!activeDimensionFilters[key]) return null;
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={meta.shortName}
                      stroke={meta.color}
                      strokeWidth={1.8}
                      dot={{ r: 3, fill: meta.color }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 2: DEDICATED CURRENT IQ GROWTH CURVE */}
          {chartView === 'iq' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progressionData}
                margin={{ top: 15, right: 25, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="iqGoldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  domain={['dataMin - 10', 'dataMax + 20']}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />

                <ReferenceLine
                  y={100}
                  stroke="#475569"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Genesis Baseline (100 IQ)',
                    fill: '#94a3b8',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <ReferenceLine
                  y={120}
                  stroke="#0284c7"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Tier I: Superior Reasoning (120)',
                    fill: '#38bdf8',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <ReferenceLine
                  y={140}
                  stroke="#9333ea"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Tier II: Genius Synthesis (140)',
                    fill: '#c084fc',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="iq"
                  name="Current IQ Trajectory"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#iqGoldGradient)"
                  dot={{ r: 5, fill: '#b45309', stroke: '#fbbf24', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 3: COGNITIVE DIMENSIONS MULTI-LINE MATRIX */}
          {chartView === 'dimensions' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progressionData}
                margin={{ top: 15, right: 25, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  domain={['dataMin - 10', 'dataMax + 15']}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />

                {Object.entries(dimensionMeta).map(([key, meta]) => {
                  if (!activeDimensionFilters[key]) return null;
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={meta.label}
                      stroke={meta.color}
                      strokeWidth={2.4}
                      dot={{ r: 4, fill: meta.color }}
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 4: RADIAL DELTA (Genesis Gen 1 vs Current Gen) */}
          {chartView === 'radar' && (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="75%"
                data={radarData}
              >
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'monospace' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[70, 'auto']}
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} pts`,
                    name === 'genesis' ? 'Gen 1 Genesis' : `Gen ${currentGen} Current`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Radar
                  name="Gen 1 Genesis Base"
                  dataKey="genesis"
                  stroke="#64748b"
                  fill="#64748b"
                  fillOpacity={0.2}
                />
                <Radar
                  name={`Gen ${currentGen} Active State`}
                  dataKey="current"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Footer Insight */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Dynamic Recharts telemetry: Hover over any epoch node for granular synaptogenesis diagnostic proofs.
            </span>
          </div>
          <span className="text-emerald-400 font-semibold">
            Status: Active Synaptic Feedback Loop
          </span>
        </div>
      </div>

      {/* Active System DNA Viewer */}
      {showPromptDNA && (
        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4 font-mono text-xs text-cyan-300 overflow-x-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              Live Synthesized Cognitive Directives
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              ACTIVE IN RUNTIME
            </span>
          </div>
          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {compiledDNA}
          </pre>
        </div>
      )}

      {/* Timeline Stream (Newest first) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            Generational Proofs & Audit Log
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {generations.length} recorded {generations.length === 1 ? 'epoch' : 'epochs'}
          </span>
        </div>

        {[...generations].reverse().map((g) => {
          const isLatest = g.gen === currentGen;
          const isExpanded = expandedGen === g.gen || isLatest;

          return (
            <div
              key={g.gen}
              className={`rounded-xl border transition-all ${
                isLatest
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-500/20'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Generation Header Row */}
              <div
                onClick={() => toggleExpand(g.gen)}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isLatest
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    G{g.gen}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-slate-100">
                        Generation {g.gen}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold animate-pulse">
                          CURRENT CORE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{g.timestamp}</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-semibold">
                        Module: {g.upgrade?.moduleName || 'Genesis Synapse'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      IQ {g.iqScore}
                      {g.deltaIQ > 0 && (
                        <span className="text-[11px] text-emerald-400 font-normal">
                          (+{g.deltaIQ})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {g.diagnostic?.domain || 'Cognitive Core'}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Detailed Evolutionary Breakdown */}
              {isExpanded && (
                <div className="px-3.5 pb-4 pt-1 border-t border-slate-800/80 space-y-3 font-sans text-xs">
                  {/* Diagnosed Limitation */}
                  {g.diagnostic && (
                    <div className="bg-slate-950/80 border border-amber-900/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        DIAGNOSED LIMITATION IN GEN {g.gen - 1 || 0}
                      </div>
                      <p className="text-slate-300 mb-1 leading-relaxed">
                        <strong className="text-amber-200">Weakness:</strong> {g.diagnostic.weaknessFound}
                      </p>
                      <p className="text-slate-400 text-[11px] font-mono leading-relaxed">
                        <span className="text-slate-500">Probe Test:</span> {g.diagnostic.testProblem}
                      </p>
                    </div>
                  )}

                  {/* Synthesized Upgrade */}
                  {g.upgrade && (
                    <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-mono text-[11px] font-bold mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        ARCHITECTURAL MUTATION: {g.upgrade.moduleName}
                      </div>
                      <p className="text-slate-300 mb-1.5">{g.upgrade.description}</p>
                      <div className="bg-slate-950 rounded p-2 border border-indigo-950 font-mono text-[11px] text-cyan-300">
                        {g.upgrade.cognitiveRule}
                      </div>
                    </div>
                  )}

                  {/* Benchmark Proof */}
                  {g.benchmarkVerification && (
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          BENCHMARK VERIFICATION: {g.benchmarkVerification.challengeName}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-400 font-bold">
                          Score: {g.benchmarkVerification.beforeScore}% →{' '}
                          <span className="text-cyan-300">{g.benchmarkVerification.afterScore}%</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
                        {g.benchmarkVerification.evaluatorProof}
                      </p>
                    </div>
                  )}

                  {/* Cognitive Manifesto Quote */}
                  {g.cognitiveManifesto && (
                    <div className="bg-slate-950/90 border-l-2 border-cyan-400 p-3 rounded-r-lg">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">
                        <Quote className="w-3 h-3 text-cyan-400" />
                        Autonomous Cognitive Manifesto
                      </div>
                      <p className="text-slate-300 italic text-xs leading-relaxed">
                        &ldquo;{g.cognitiveManifesto}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
