import React, { useState, useEffect } from 'react';
import { StarkPlugin, WorkTaskItem, WorkResearchCitation } from '../types.ts';
import {
  Globe,
  Calculator,
  Plug,
  FileText,
  Cpu,
  Brain,
  CheckCircle,
  Power,
  Play,
  Sparkles,
  Server,
  Upload,
  HardDrive,
  Battery,
  Wifi,
  Settings,
  ShieldCheck,
  Terminal,
  Search,
  Calendar,
  BarChart3,
  Database,
  Layers,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Code2,
  Table,
  Plus,
  Trash2,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface PluginMatrixProps {
  plugins: StarkPlugin[];
  onTogglePlugin: (id: string) => void;
  onUpdateConfig: (id: string, config: Record<string, string>) => void;
  onAddKnowledgeEntry?: (entry: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type WorkPluginTab = 'terminal' | 'research' | 'analytics' | 'schedule' | 'vault' | 'overview';

export const PluginMatrix: React.FC<PluginMatrixProps> = ({
  plugins,
  onTogglePlugin,
  onUpdateConfig,
  onAddKnowledgeEntry,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<WorkPluginTab>('terminal');

  // ==========================================
  // 1. Code & Terminal Automation Sandbox State
  // ==========================================
  const [terminalLang, setTerminalLang] = useState<'javascript' | 'python' | 'bash' | 'sql'>('javascript');
  const [terminalCode, setTerminalCode] = useState<string>(
    `// Software Engineering: Compute API Gateway Latency & Throughput SLA\nconst latencySamplesMs = [18, 22, 35, 19, 45, 92, 110, 24, 30, 28, 65, 142];\nconst p50 = latencySamplesMs.sort((a, b) => a - b)[Math.floor(latencySamplesMs.length * 0.5)];\nconst p95 = latencySamplesMs[Math.floor(latencySamplesMs.length * 0.95)];\nconst p99 = latencySamplesMs[Math.floor(latencySamplesMs.length * 0.99)];\n\nconsole.log("Telemetry Processed:", latencySamplesMs.length, "requests");\nconsole.log("P50 Latency:", p50 + "ms");\nconsole.log("P95 Latency:", p95 + "ms");\nconsole.log("P99 Latency (SLA Warning threshold 100ms):", p99 + "ms");\n\nconst status = p99 > 100 ? "WARNING_BREACHED" : "NOMINAL";\nconsole.log("SLA Status:", status);`
  );
  const [terminalResult, setTerminalResult] = useState<any>(null);
  const [isTerminalRunning, setIsTerminalRunning] = useState<boolean>(false);

  // ==========================================
  // 2. Web & Technical Research Agent State
  // ==========================================
  const [researchQuery, setResearchQuery] = useState<string>('PostgreSQL pgbouncer transaction pooling connection limits');
  const [researchDomain, setResearchDomain] = useState<'general' | 'mdn' | 'github' | 'rfc'>('github');
  const [researchResult, setResearchResult] = useState<any>(null);
  const [isResearchLoading, setIsResearchLoading] = useState<boolean>(false);

  // ==========================================
  // 3. Data Analysis & Spreadsheet State
  // ==========================================
  const [csvContent, setCsvContent] = useState<string>(
    `timestamp,service_name,p50_latency_ms,p95_latency_ms,p99_latency_ms,rps,error_rate_pct\n2026-10-19T21:00:00Z,api-gateway,18,45,110,1420,0.01\n2026-10-19T21:15:00Z,api-gateway,22,54,142,1580,0.02\n2026-10-19T21:30:00Z,api-gateway,35,92,260,2200,0.18\n2026-10-19T21:45:00Z,api-gateway,20,48,115,1600,0.01\n2026-10-19T22:00:00Z,auth-service,12,28,65,950,0.00\n2026-10-19T22:15:00Z,auth-service,14,32,72,1020,0.00\n2026-10-19T22:30:00Z,billing-engine,65,180,420,380,0.05\n2026-10-19T22:45:00Z,database-proxy,8,19,44,3100,0.00`
  );
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);

  // ==========================================
  // 4. Sprint Task Scheduler State
  // ==========================================
  const [sprintTasks, setSprintTasks] = useState<WorkTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P1');
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [copiedNotes, setCopiedNotes] = useState<boolean>(false);

  // ==========================================
  // 5. File Vault & ADR Archiver State
  // ==========================================
  const [adrTitle, setAdrTitle] = useState<string>('ADR-004: Event-Driven Agentic Orchestration');
  const [generatedAdr, setGeneratedAdr] = useState<string | null>(null);
  const [isAdrGenerating, setIsAdrGenerating] = useState<boolean>(false);

  // Fetch initial tasks on mount
  useEffect(() => {
    fetch('/api/plugin/work-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_tasks' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.tasks) {
          setSprintTasks(data.tasks);
        }
      })
      .catch(() => {});
  }, []);

  // 1. Run Terminal Sandbox
  const handleExecuteTerminal = async () => {
    sound.playScan();
    setIsTerminalRunning(true);
    setTerminalResult(null);

    try {
      const res = await fetch('/api/plugin/work-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: terminalLang,
          code: terminalCode,
          command: terminalCode,
        }),
      });
      const data = await res.json();
      setTerminalResult(data);
      sound.playUpgradeSuccess();
      showToast?.(`Terminal: Executed ${terminalLang.toUpperCase()} script in ${data.durationMs || 0}ms`, 'success');
    } catch (err: any) {
      setTerminalResult({ success: false, stderr: err.message || String(err) });
      showToast?.('Terminal execution error', 'error');
    } finally {
      setIsTerminalRunning(false);
    }
  };

  // 2. Run Research Agent
  const handleExecuteResearch = async () => {
    if (!researchQuery.trim()) return;
    sound.playScan();
    setIsResearchLoading(true);
    setResearchResult(null);

    try {
      const res = await fetch('/api/plugin/work-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: researchQuery,
          targetDomain: researchDomain,
        }),
      });
      const data = await res.json();
      setResearchResult(data);
      sound.playUpgradeSuccess();
      showToast?.(`Research Agent: Found ${data.citations?.length || 0} cited technical references.`, 'success');
    } catch (err: any) {
      showToast?.('Research query failed: ' + err.message, 'error');
    } finally {
      setIsResearchLoading(false);
    }
  };

  // 3. Run Analytics
  const handleExecuteAnalytics = async () => {
    sound.playScan();
    setIsAnalyticsLoading(true);
    setAnalyticsResult(null);

    try {
      const res = await fetch('/api/plugin/work-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvContent }),
      });
      const data = await res.json();
      setAnalyticsResult(data);
      sound.playUpgradeSuccess();
      showToast?.(`Analytics Engine: Computed stats for ${data.rowCount} records.`, 'success');
    } catch (err: any) {
      showToast?.('Analytics parsing failed: ' + err.message, 'error');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // 4. Sprint Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    sound.playClick();

    try {
      const res = await fetch('/api/plugin/work-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_task',
          payload: {
            title: newTaskTitle.trim(),
            priority: newTaskPriority,
            status: 'todo',
            dueTimestamp: 'Sprint Target',
            assignee: 'DevOps Agent',
            category: 'Engineering',
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.tasks) {
        setSprintTasks(data.tasks);
        setNewTaskTitle('');
        showToast?.('Sprint task created.', 'success');
      }
    } catch {}
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    sound.playClick();
    try {
      const res = await fetch('/api/plugin/work-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          payload: { taskId },
        }),
      });
      const data = await res.json();
      if (data.success && data.tasks) {
        setSprintTasks(data.tasks);
      }
    } catch {}
  };

  const handleDeleteTask = async (taskId: string) => {
    sound.playClick();
    try {
      const res = await fetch('/api/plugin/work-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_task',
          payload: { taskId },
        }),
      });
      const data = await res.json();
      if (data.success && data.tasks) {
        setSprintTasks(data.tasks);
        showToast?.('Task removed from backlog.', 'info');
      }
    } catch {}
  };

  const handleGenerateReleaseNotes = async () => {
    sound.playSynapticSpark();
    try {
      const res = await fetch('/api/plugin/work-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_release_notes' }),
      });
      const data = await res.json();
      if (data.success && data.releaseNotes) {
        setReleaseNotes(data.releaseNotes);
        showToast?.('Drafted sprint release notes in Markdown.', 'success');
      }
    } catch {}
  };

  // 5. Generate & Archive ADR
  const handleGenerateAdr = async () => {
    sound.playSynapticSpark();
    setIsAdrGenerating(true);
    try {
      const res = await fetch('/api/plugin/work-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_adr',
          title: adrTitle,
        }),
      });
      const data = await res.json();
      if (data.success && data.adr) {
        setGeneratedAdr(data.adr);
        if (onAddKnowledgeEntry) {
          onAddKnowledgeEntry({
            title: adrTitle,
            category: 'directive',
            summary: `Architecture Decision Record for ${adrTitle}`,
            content: data.adr,
            tags: ['Architecture', 'ADR', 'DevOps', 'EngineeringStandards'],
            sourceOrigin: 'operator_manual',
            confidenceScore: 100,
            activeInRecall: true,
          });
        }
        showToast?.(`Archived "${adrTitle}" to Knowledge Vault permanently.`, 'success');
      }
    } catch {} finally {
      setIsAdrGenerating(false);
    }
  };

  const getPluginIcon = (id: string) => {
    switch (id) {
      case 'work_terminal':
        return <Terminal className="w-5 h-5 text-cyan-400" />;
      case 'work_research':
        return <Search className="w-5 h-5 text-emerald-400" />;
      case 'work_schedule':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'work_analytics':
        return <BarChart3 className="w-5 h-5 text-indigo-400" />;
      case 'work_vault':
        return <Database className="w-5 h-5 text-violet-400" />;
      case 'google_search':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'webhook':
        return <Plug className="w-5 h-5 text-amber-400" />;
      default:
        return <Server className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              OMNIWORK // AUTONOMOUS SOFTWARE ENGINEERING &amp; DEVOPS PLUGINS
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            5 production-grade execution engines: Code &amp; Terminal Sandbox, Technical Doc Research, Task Scheduler, Data Analytics, and Vault Archiver.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {plugins.filter((p) => p.enabled).length} / {plugins.length} Work Engines Online
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800 flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Supervised Clearance Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs for the 5 Work Engines + Overview */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar font-mono text-xs">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('terminal');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'terminal'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>1. Code &amp; Terminal Sandbox</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('research');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'research'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>2. Doc &amp; Web Research</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('analytics');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>3. Data Analytics &amp; CSV</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('schedule');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>4. Sprint Task Scheduler</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('vault');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'vault'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>5. File Vault &amp; ADRs</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('overview');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Subsystem Plugins</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CODE & TERMINAL AUTOMATION SANDBOX                 */}
      {/* ========================================================= */}
      {activeTab === 'terminal' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Isolated Code &amp; Terminal Execution Sandbox</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluates scripts in a protected VM context with stdout/stderr capture, execution telemetry, and auto-debugger diagnostics.
              </p>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              {(['javascript', 'bash', 'sql', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    sound.playClick();
                    setTerminalLang(lang);
                    if (lang === 'bash') {
                      setTerminalCode('git status\ngit log -n 2');
                    } else if (lang === 'sql') {
                      setTerminalCode('SELECT service, latency_p95_ms, status FROM cluster_services WHERE error_rate_pct < 0.1 ORDER BY latency_p95_ms ASC;');
                    } else if (lang === 'python') {
                      setTerminalCode('def calculate_sla(p99_latency):\n    return "PASS" if p99_latency <= 120 else "BREACH"\n\nprint("SLA Validation Result:", calculate_sla(85))');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg border uppercase transition text-[11px] ${
                    terminalLang === lang
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Script Preset Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-[11px]">
            <span className="text-slate-500 shrink-0">Presets:</span>
            <button
              onClick={() => {
                setTerminalLang('javascript');
                setTerminalCode(
                  `// Microservice Circuit Breaker Simulator\nclass CircuitBreaker {\n  constructor(threshold = 3) {\n    this.threshold = threshold;\n    this.failures = 0;\n    this.state = "CLOSED";\n  }\n  recordFailure() {\n    this.failures++;\n    if (this.failures >= this.threshold) this.state = "OPEN";\n  }\n}\nconst cb = new CircuitBreaker();\ncb.recordFailure();\ncb.recordFailure();\ncb.recordFailure();\nconsole.log("Circuit Breaker State:", cb.state);`
                );
              }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500/50 shrink-0 transition"
            >
              Circuit Breaker
            </button>
            <button
              onClick={() => {
                setTerminalLang('bash');
                setTerminalCode('git status');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500/50 shrink-0 transition"
            >
              Git Status
            </button>
            <button
              onClick={() => {
                setTerminalLang('sql');
                setTerminalCode('SELECT service, status, latency_p95_ms, replica_count FROM cluster_services WHERE status = "healthy";');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500/50 shrink-0 transition"
            >
              Query Services SQL
            </button>
            <button
              onClick={() => {
                setTerminalLang('javascript');
                setTerminalCode(`// Testing Auto-Debugger Error Interception\nconsole.log("Starting test...");\nconst res = undefinedVariable.triggerError();\nconsole.log(res);`);
              }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-rose-900/60 text-rose-300 hover:border-rose-500 shrink-0 transition"
            >
              Simulate Syntax Bug
            </button>
          </div>

          {/* Code Editor Area */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>sandbox_script.{terminalLang === 'javascript' ? 'js' : terminalLang === 'python' ? 'py' : terminalLang === 'sql' ? 'sql' : 'sh'}</span>
              </span>
              <span>Protected Sandbox • Max Timeout 6000ms</span>
            </div>

            <textarea
              value={terminalCode}
              onChange={(e) => setTerminalCode(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 p-3 text-cyan-200 font-mono text-xs focus:outline-none resize-y selection:bg-cyan-900 selection:text-white"
              spellCheck={false}
            />
          </div>

          {/* Run Button */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Press Run to execute script inside isolated container VM.
            </span>

            <button
              onClick={handleExecuteTerminal}
              disabled={isTerminalRunning}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTerminalRunning ? 'Executing in Sandbox...' : 'Run in Sandbox'}</span>
            </button>
          </div>

          {/* Live Output Console */}
          {terminalResult && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs animate-in fade-in space-y-2 p-3">
              <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${terminalResult.exitCode === 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
                  <span className="font-bold text-slate-200">
                    Exit Code: {terminalResult.exitCode} {terminalResult.exitCode === 0 ? '(SUCCESS)' : '(INTERCEPTED BUG)'}
                  </span>
                </span>
                <span className="text-slate-400">Duration: {terminalResult.durationMs}ms</span>
              </div>

              {/* Table Data if SQL */}
              {terminalResult.tableData && (
                <div className="overflow-x-auto my-2 border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                      <tr>
                        {Object.keys(terminalResult.tableData[0] || {}).map((col) => (
                          <th key={col} className="p-2 font-bold uppercase">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-200">
                      {terminalResult.tableData.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/60">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="p-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Stdout Output */}
              {terminalResult.stdout && (
                <div>
                  <div className="text-[10px] uppercase text-emerald-400 font-bold mb-1">STDOUT:</div>
                  <pre className="p-2.5 rounded-lg bg-black/60 border border-slate-850 text-emerald-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto max-h-48">
                    {terminalResult.stdout}
                  </pre>
                </div>
              )}

              {/* Stderr Output */}
              {terminalResult.stderr && (
                <div>
                  <div className="text-[10px] uppercase text-rose-400 font-bold mb-1">STDERR:</div>
                  <pre className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto">
                    {terminalResult.stderr}
                  </pre>
                </div>
              )}

              {/* Auto-Debugger Diagnostics */}
              {terminalResult.diagnostics && terminalResult.diagnostics.length > 0 && (
                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autonomous Self-Healer Diagnostic Insight:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {terminalResult.diagnostics.map((diag: string, i: number) => (
                      <li key={i}>{diag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LIVE WEB & TECHNICAL DOCUMENT RESEARCH AGENT        */}
      {/* ========================================================= */}
      {activeTab === 'research' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Live Technical Web &amp; Document Research Agent</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Crawls developer documentation, RFC specs, GitHub best practices, and MDN references, generating cited synthesis.
              </p>
            </div>

            {/* Domain Filter */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              {(['general', 'github', 'mdn', 'rfc'] as const).map((dom) => (
                <button
                  key={dom}
                  onClick={() => {
                    sound.playClick();
                    setResearchDomain(dom);
                  }}
                  className={`px-2.5 py-1 rounded-lg border uppercase transition text-[11px] ${
                    researchDomain === dom
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* Research Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={researchQuery}
              onChange={(e) => setResearchQuery(e.target.value)}
              placeholder="Search engineering topic, architecture pattern, or library spec..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleExecuteResearch}
              disabled={isResearchLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isResearchLoading ? 'Crawling...' : 'Research Docs'}</span>
            </button>
          </div>

          {/* Preset Prompts */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-[11px]">
            <span className="text-slate-500 shrink-0">Inquiries:</span>
            {[
              'PostgreSQL pgbouncer transaction pooling connection limits',
              'Node.js worker thread memory leaks diagnosis',
              'Kubernetes liveness vs readiness probes',
              'Ed25519 vs RSA JWT keys performance',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  sound.playClick();
                  setResearchQuery(q);
                }}
                className="px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:border-emerald-500/50 shrink-0 transition"
              >
                {q.slice(0, 30)}...
              </button>
            ))}
          </div>

          {/* Research Results Deck */}
          {researchResult && (
            <div className="rounded-xl border border-emerald-900/60 bg-slate-950 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Synthesized Technical Intelligence // &ldquo;{researchResult.query}&rdquo;</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Duration: {researchResult.durationMs}ms</span>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {researchResult.summary}
              </p>

              {/* Citations List */}
              {researchResult.citations && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Cited References:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {researchResult.citations.map((c: WorkResearchCitation, i: number) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 text-xs block transition space-y-1 group"
                      >
                        <div className="font-mono font-bold text-emerald-300 text-[11px] flex items-center justify-between">
                          <span className="truncate">{c.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-1" />
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{c.snippet}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Snippets */}
              {researchResult.codeSnippets && researchResult.codeSnippets.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Production Code Pattern:</div>
                  {researchResult.codeSnippets.map((s: any, i: number) => (
                    <div key={i} className="rounded-lg border border-slate-800 bg-black/60 p-2.5 font-mono text-xs">
                      <div className="text-[10px] text-slate-400 mb-1">{s.title} ({s.language}):</div>
                      <pre className="text-cyan-300 text-[11px] overflow-x-auto whitespace-pre-wrap">{s.code}</pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Takeaways */}
              {researchResult.keyTakeaways && (
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 text-[11px] space-y-1">
                  <div className="font-bold uppercase text-[10px] tracking-wider text-emerald-400">Key Engineering Takeaways:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {researchResult.keyTakeaways.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DATA ANALYSIS & SPREADSHEET ENGINE                 */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>DevOps Telemetry &amp; Spreadsheet Analytics Engine</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculates latency distributions, error budget burns, and renders real-time interactive SVG service charts.
              </p>
            </div>

            <button
              onClick={handleExecuteAnalytics}
              disabled={isAnalyticsLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAnalyticsLoading ? 'Computing...' : 'Run Statistical Analysis'}</span>
            </button>
          </div>

          {/* CSV Input Editor */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
              <span>devops_service_telemetry.csv</span>
              <span>Paste custom CSV rows or edit data directly</span>
            </div>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 p-3 text-indigo-200 font-mono text-xs focus:outline-none resize-y selection:bg-indigo-900 selection:text-white"
            />
          </div>

          {/* Analytics Results Dashboard */}
          {analyticsResult && (
            <div className="space-y-4 animate-in fade-in">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] uppercase text-slate-400">Total Rows</span>
                  <div className="text-lg font-bold text-white">{analyticsResult.rowCount}</div>
                  <span className="text-[10px] text-indigo-400">{analyticsResult.columnCount} columns</span>
                </div>

                {analyticsResult.statistics['p95_latency_ms'] && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase text-slate-400">Mean P95 Latency</span>
                    <div className="text-lg font-bold text-cyan-400">{analyticsResult.statistics['p95_latency_ms'].avg}ms</div>
                    <span className="text-[10px] text-slate-400">Max: {analyticsResult.statistics['p95_latency_ms'].max}ms</span>
                  </div>
                )}

                {analyticsResult.statistics['p99_latency_ms'] && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase text-slate-400">Max P99 Latency</span>
                    <div className="text-lg font-bold text-amber-400">{analyticsResult.statistics['p99_latency_ms'].max}ms</div>
                    <span className="text-[10px] text-slate-400">Median: {analyticsResult.statistics['p99_latency_ms'].median}ms</span>
                  </div>
                )}

                {analyticsResult.statistics['error_rate_pct'] && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase text-slate-400">Max Error Rate</span>
                    <div className="text-lg font-bold text-rose-400">{analyticsResult.statistics['error_rate_pct'].max}%</div>
                    <span className="text-[10px] text-slate-400">SLO: 99.9% Nominal</span>
                  </div>
                )}
              </div>

              {/* Rendered SVG Chart */}
              {analyticsResult.chartData && analyticsResult.chartData.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-indigo-300">P95 Latency Telemetry Distribution (ms)</span>
                    <span className="text-[10px] text-slate-400">Dynamic SVG Bar Rendering</span>
                  </div>

                  <div className="h-44 flex items-end gap-2 pt-4 border-b border-slate-800 px-2">
                    {analyticsResult.chartData.map((d: any, i: number) => {
                      const maxVal = Math.max(...analyticsResult.chartData.map((c: any) => c.value), 1);
                      const heightPct = Math.round((d.value / maxVal) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-white whitespace-nowrap z-10">
                            {d.label}: {d.value}ms
                          </div>
                          <div
                            style={{ height: `${Math.max(heightPct, 6)}%` }}
                            className={`w-full rounded-t-md transition-all ${
                              d.value > 150
                                ? 'bg-gradient-to-t from-amber-600 to-rose-500'
                                : 'bg-gradient-to-t from-indigo-600 to-cyan-400'
                            }`}
                          />
                          <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                            {d.label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Insights */}
              {analyticsResult.insights && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs text-slate-300">
                  <div className="text-[10px] font-bold uppercase text-indigo-400">Autonomous Engineering Insights:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {analyticsResult.insights.map((ins: string, i: number) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CALENDAR, EMAIL & SPRINT TASK SCHEDULER             */}
      {/* ========================================================= */}
      {activeTab === 'schedule' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Sprint Task Backlog &amp; Release Notes Generator</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Organizes priority deliverables, manages deadline reminders, and drafts autonomous Markdown release notes.
              </p>
            </div>

            <button
              onClick={handleGenerateReleaseNotes}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Draft Release Notes</span>
            </button>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleCreateTask} className="flex gap-2 font-mono text-xs">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add sprint engineering task (e.g. Optimize Redis warm-up script)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
            >
              <option value="P0">P0 - Blocker</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Sprint Tasks List */}
          <div className="space-y-2">
            {sprintTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono transition hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                      task.status === 'done'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                        : 'border-slate-700 hover:border-cyan-500'
                    }`}
                  >
                    {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          task.priority === 'P0'
                            ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                            : task.priority === 'P1'
                            ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className={`font-bold truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Due: {task.dueTimestamp}</span>
                      <span>·</span>
                      <span>Assignee: {task.assignee}</span>
                      {task.notes && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400 italic truncate">{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Generated Release Notes Modal / Drawer */}
          {releaseNotes && (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/60 font-mono text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Autonomously Drafted Release Notes (Markdown)</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(releaseNotes);
                    setCopiedNotes(true);
                    setTimeout(() => setCopiedNotes(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 font-bold"
                >
                  {copiedNotes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedNotes ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
              </div>
              <pre className="text-slate-200 whitespace-pre-wrap text-[11px] overflow-x-auto max-h-60 bg-black/60 p-3 rounded-lg border border-slate-850">
                {releaseNotes}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: FILE VAULT & ARCHITECTURE DECISION RECORDS (ADR)   */}
      {/* ========================================================= */}
      {activeTab === 'vault' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-400" />
                <span>Architecture Decision Records (ADR) &amp; Vault Archiver</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Formulates RFC-compliant Architecture Decision Records and permanently stores engineering standards in the Knowledge Vault.
              </p>
            </div>

            <button
              onClick={handleGenerateAdr}
              disabled={isAdrGenerating}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-950 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isAdrGenerating ? 'Compiling...' : 'Generate & Archive ADR'}</span>
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <label className="text-slate-300 block">ADR Title / Subject:</label>
            <input
              type="text"
              value={adrTitle}
              onChange={(e) => setAdrTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          {generatedAdr && (
            <div className="p-4 rounded-xl bg-slate-950 border border-violet-900/60 font-mono text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-violet-300">Generated RFC Decision Record:</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3" />
                  <span>Archived into Knowledge Vault</span>
                </span>
              </div>
              <pre className="text-slate-200 whitespace-pre-wrap text-[11px] overflow-x-auto max-h-72 bg-black/60 p-3 rounded-lg border border-slate-850">
                {generatedAdr}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: ALL SUBSYSTEM PLUGINS OVERVIEW                     */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                plugin.enabled
                  ? 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/30'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {getPluginIcon(plugin.id)}
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-slate-100">
                        {plugin.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Category: {plugin.category}
                      </span>
                    </div>
                  </div>

                  {/* Power Toggle */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      onTogglePlugin(plugin.id);
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      plugin.enabled
                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800 hover:bg-cyan-900/60'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                    }`}
                    title={plugin.enabled ? 'Deactivate Plugin' : 'Activate Plugin'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-3">
                  {plugin.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Status:</span>
                <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                  plugin.enabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'
                }`}>
                  {plugin.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
