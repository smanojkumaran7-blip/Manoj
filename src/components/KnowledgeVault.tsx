import React, { useState, useEffect, useRef } from 'react';
import { KnowledgeEntry, InteractionMessage } from '../types.ts';
import {
  Database,
  Brain,
  Search,
  Plus,
  Sparkles,
  Pin,
  Tag,
  Shield,
  Activity,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
  Send,
  Download,
  Upload,
  RefreshCw,
  Compass,
  Zap,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface KnowledgeVaultProps {
  entries: KnowledgeEntry[];
  currentGen: number;
  recentMessages?: InteractionMessage[];
  onAddEntry: (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'recallCount'>) => void;
  onUpdateEntry: (id: string, updates: Partial<KnowledgeEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onRecallInChat: (query: string) => void;
  onBatchImport: (entries: KnowledgeEntry[]) => void;
}

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({
  entries,
  currentGen,
  recentMessages = [],
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onRecallInChat,
  onBatchImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'graph'>('cards');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  // New Memory Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeEntry['category']>('finding');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newConfidence, setNewConfidence] = useState(98);

  // Auto-Synthesize state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizeStatus, setSynthesizeStatus] = useState<string | null>(null);

  // Test Recall state
  const [isRecallTesterOpen, setIsRecallTesterOpen] = useState(false);
  const [recallTestQuery, setRecallTestQuery] = useState('');
  const [isQueryingRecall, setIsQueryingRecall] = useState(false);
  const [recallTestResult, setRecallTestResult] = useState<{
    recalledIds: string[];
    synthesizedAnswer: string;
    relevanceExplanation: string;
  } | null>(null);

  // Canvas ref for Interactive Constellation Graph
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Filtered entries
  const filteredEntries = entries.filter((item) => {
    if (showPinnedOnly && !item.pinned) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedTag && !item.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchContent && !matchTags) return false;
    }
    return true;
  });

  // Unique tags
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).slice(0, 16);

  // Category statistics
  const stats = {
    total: entries.length,
    activeInRecall: entries.filter((e) => e.activeInRecall).length,
    pinned: entries.filter((e) => e.pinned).length,
    totalRecalls: entries.reduce((acc, e) => acc + (e.recallCount || 0), 0),
    avgConfidence:
      entries.length > 0
        ? Math.round(entries.reduce((acc, e) => acc + e.confidenceScore, 0) / entries.length)
        : 100,
  };

  const getCategoryColor = (cat: KnowledgeEntry['category']) => {
    switch (cat) {
      case 'directive':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'finding':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'axiom':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'summary':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'preference':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getCategoryDot = (cat: KnowledgeEntry['category']) => {
    switch (cat) {
      case 'directive':
        return '#f59e0b';
      case 'finding':
        return '#06b6d4';
      case 'axiom':
        return '#a855f7';
      case 'summary':
        return '#10b981';
      case 'preference':
        return '#f43f5e';
      default:
        return '#64748b';
    }
  };

  // Canvas visualizer simulation
  useEffect(() => {
    if (viewMode !== 'graph') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 420);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 420;
    };
    window.addEventListener('resize', handleResize);

    // Node items
    const nodes = filteredEntries.map((e, idx) => {
      const angle = (idx / (filteredEntries.length || 1)) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.32 + ((idx % 3) - 1) * 35;
      return {
        id: e.id,
        entry: e,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 7 + Math.min(8, (e.recallCount || 0) * 0.8),
        color: getCategoryDot(e.category),
      };
    });

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Background grid & radar rings
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Center core node (Jarvis Brain Hub)
      const centerPulse = 18 + Math.sin(frame * 0.05) * 3;
      const grad = ctx.createRadialGradient(width / 2, height / 2, 2, width / 2, height / 2, centerPulse * 2);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, centerPulse * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CORE', width / 2, height / 2);

      // Draw connection lines between nodes sharing tags or connected to center
      nodes.forEach((n1, i) => {
        // Line to center
        ctx.strokeStyle = n1.entry.activeInRecall ? 'rgba(6, 182, 212, 0.15)' : 'rgba(71, 85, 105, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(n1.x, n1.y);
        ctx.stroke();

        // Cross connections to nodes with matching tags
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const hasCommonTag = n1.entry.tags.some((t) => n2.entry.tags.includes(t));
          if (hasCommonTag) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      });

      // Update and draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Boundaries
        if (node.x < 40 || node.x > width - 40) node.vx *= -1;
        if (node.y < 40 || node.y > height - 40) node.vy *= -1;

        // Draw node pulse if selected or recalled frequently
        if (selectedEntry?.id === node.id || node.entry.pinned) {
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 4 + Math.sin(frame * 0.08) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.entry.title.slice(0, 18) + (node.entry.title.length > 18 ? '..' : ''), node.x, node.y + node.size + 12);
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    // Click handler for canvas nodes
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let found = false;
      for (const node of nodes) {
        const dist = Math.hypot(node.x - clickX, node.y - clickY);
        if (dist <= node.size + 6) {
          sound.playClick();
          setSelectedEntry(node.entry);
          found = true;
          break;
        }
      }
      if (!found) {
        setSelectedEntry(null);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleCanvasClick);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewMode, filteredEntries, selectedEntry]);

  // Handle Form Submission for New Memory
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddEntry({
      title: newTitle.trim(),
      category: newCategory,
      summary: newSummary.trim() || newTitle.trim(),
      content: newContent.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['Directive', 'Knowledge'],
      sourceOrigin: 'operator_manual',
      confidenceScore: newConfidence,
      pinned: true,
      activeInRecall: true,
    });

    sound.playUpgradeSuccess();
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewTags('');
  };

  // Handle Auto-Synthesizing from recent chat interaction
  const handleAutoSynthesize = async () => {
    if (recentMessages.length === 0) {
      setSynthesizeStatus('No recent interaction messages found in Cognitive Chamber to synthesize.');
      setTimeout(() => setSynthesizeStatus(null), 3500);
      return;
    }

    sound.playScan();
    setIsSynthesizing(true);
    setSynthesizeStatus('Distilling key findings, axioms & summaries via Gemini 3.8 Flash...');

    try {
      const res = await fetch('/api/vault/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          currentGen,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.entries) {
        throw new Error(data.error || 'Failed to synthesize');
      }

      data.entries.forEach((item: KnowledgeEntry) => {
        onAddEntry({
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          tags: item.tags,
          sourceOrigin: item.sourceOrigin,
          sourceId: item.sourceId,
          confidenceScore: item.confidenceScore,
          pinned: item.pinned,
          activeInRecall: item.activeInRecall,
        });
      });

      sound.playUpgradeSuccess();
      setSynthesizeStatus(`Successfully synthesized & archived ${data.entries.length} findings into Knowledge Vault!`);
      setTimeout(() => setSynthesizeStatus(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setSynthesizeStatus('Auto-synthesis error. Please try again.');
      setTimeout(() => setSynthesizeStatus(null), 3500);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Handle Testing Recall Query
  const handleExecuteRecallTest = async () => {
    if (!recallTestQuery.trim()) return;

    sound.playScan();
    setIsQueryingRecall(true);
    setRecallTestResult(null);

    try {
      const res = await fetch('/api/vault/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: recallTestQuery,
          knowledgeVault: entries.filter((e) => e.activeInRecall),
          currentGen,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Recall query failed');

      setRecallTestResult({
        recalledIds: data.recalledIds || [],
        synthesizedAnswer: data.synthesizedAnswer || '',
        relevanceExplanation: data.relevanceExplanation || '',
      });

      // Increment recall counts for recalled entries
      if (Array.isArray(data.recalledIds)) {
        data.recalledIds.forEach((id: string) => {
          const entry = entries.find((e) => e.id === id);
          if (entry) {
            onUpdateEntry(id, {
              recallCount: (entry.recallCount || 0) + 1,
              lastRecalledAt: 'Just now (Recall Test)',
            });
          }
        });
      }

      sound.playSynapticSpark();
    } catch (err) {
      console.error(err);
      setRecallTestResult({
        recalledIds: [],
        synthesizedAnswer: 'Recall query failed. Cross-reference manually.',
        relevanceExplanation: 'Error communicating with reasoning engine.',
      });
    } finally {
      setIsQueryingRecall(false);
    }
  };

  // Export Vault to JSON
  const handleExportVault = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jarvis_knowledge_vault_gen${currentGen}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sound.playClick();
  };

  // Import Vault from JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onBatchImport(parsed);
          sound.playUpgradeSuccess();
        }
      } catch (err) {
        console.error('Invalid vault JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top HUD Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Database className="w-3 h-3 text-cyan-400" /> Total Knowledge Nodes
          </div>
          <div className="text-xl font-bold text-slate-100 flex items-baseline gap-2">
            <span>{stats.total}</span>
            <span className="text-[10px] text-cyan-400 font-normal">Records</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {stats.pinned} Pinned Directives
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-emerald-400" /> Active AI Recall Set
          </div>
          <div className="text-xl font-bold text-emerald-400 flex items-baseline gap-2">
            <span>{stats.activeInRecall}</span>
            <span className="text-[10px] text-slate-400 font-normal">in context</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">
            Auto-injected into future sessions
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-purple-400" /> Recall Invocations
          </div>
          <div className="text-xl font-bold text-purple-400 flex items-baseline gap-2">
            <span>{stats.totalRecalls}</span>
            <span className="text-[10px] text-slate-400 font-normal">Triggers</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Cross-session recall frequency
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-amber-400" /> Epistemic Retention
          </div>
          <div className="text-xl font-bold text-amber-400 flex items-baseline gap-2">
            <span>{stats.avgConfidence}%</span>
            <span className="text-[10px] text-slate-400 font-normal">Fidelity</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Zero-drift persistent memory
          </div>
        </div>
      </div>

      {/* Main Header / Control Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-mono font-bold uppercase text-slate-100 tracking-wider">
                J.A.R.V.I.S. KNOWLEDGE VAULT // RECURSIVE MEMORY ARCHIVE
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes and persists key findings, axioms, and summaries from previous interactions so the AI can recall them during future sessions.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* View Switcher: Cards vs Graph */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('cards');
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" /> Cards
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('graph');
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition ${
                  viewMode === 'graph'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3" /> Constellation Graph
              </button>
            </div>

            {/* Test Recall Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsRecallTesterOpen(!isRecallTesterOpen);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                isRecallTesterOpen
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                  : 'bg-slate-800/80 text-purple-400 border-purple-500/30 hover:bg-purple-950/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test AI Recall</span>
            </button>

            {/* Auto-Synthesize from Chat Button */}
            <button
              onClick={handleAutoSynthesize}
              disabled={isSynthesizing}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Automatically analyze recent Cognitive Chamber conversation and extract key findings into vault"
            >
              {isSynthesizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isSynthesizing ? 'Synthesizing...' : 'Extract From Chat'}</span>
            </button>

            {/* Ingest / New Memory Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsCreateModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Memory</span>
            </button>

            {/* Export & Import */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportVault}
                title="Export Knowledge Vault JSON"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <label
                title="Import Knowledge Vault JSON"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer inline-flex items-center"
              >
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Status banner if synthesizing */}
        {synthesizeStatus && (
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <span>{synthesizeStatus}</span>
          </div>
        )}

        {/* Test Recall Interactive Simulator Drawer */}
        {isRecallTesterOpen && (
          <div className="p-3.5 bg-slate-950 border border-purple-500/30 rounded-xl space-y-3 font-mono animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase">
                <Zap className="w-4 h-4 text-purple-400" />
                Interactive AI Recall Simulator // Cross-Session Retrieval
              </div>
              <span className="text-[10px] text-purple-400/80">
                Tests how J.A.R.V.I.S. matches, recalls, and synthesizes answers from the Knowledge Vault
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={recallTestQuery}
                onChange={(e) => setRecallTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteRecallTest()}
                placeholder="Ask J.A.R.V.I.S. a question testing past findings (e.g., 'What are our rules about opening websites?', 'Recall the Monty Hall finding')..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
              />
              <button
                onClick={handleExecuteRecallTest}
                disabled={isQueryingRecall || !recallTestQuery.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                {isQueryingRecall ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Recall Now</span>
              </button>
            </div>

            {/* Quick pre-set recall test buttons */}
            <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-400">
              <span className="text-[10px] uppercase text-purple-400">Quick Recall Queries:</span>
              <button
                onClick={() => {
                  setRecallTestQuery('What is your strict policy on opening external websites and apps?');
                }}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-purple-400/50 text-slate-300 text-[10px]"
              >
                Website & App Permission Policy
              </button>
              <button
                onClick={() => {
                  setRecallTestQuery('Recall our findings on Monty Hall and conditional probability from Gen 1.');
                }}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-purple-400/50 text-slate-300 text-[10px]"
              >
                Gen 1 Epistemic Proof
              </button>
              <button
                onClick={() => {
                  setRecallTestQuery('What is the operator persona preference for your tone and manners?');
                }}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-purple-400/50 text-slate-300 text-[10px]"
              >
                Operator Persona Directive
              </button>
            </div>

            {/* Recall Query Result */}
            {recallTestResult && (
              <div className="mt-3 p-3 bg-purple-950/20 border border-purple-500/40 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-300 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    AI Synthesized Response from Memory:
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Recalled {recallTestResult.recalledIds.length} Nodes
                  </span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed font-sans bg-black/40 p-2.5 rounded border border-purple-900/50">
                  {recallTestResult.synthesizedAnswer}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Logic Trace: {recallTestResult.relevanceExplanation}</span>
                  <button
                    onClick={() => onRecallInChat(recallTestQuery)}
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    Send to Cognitive Chamber Chat <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-1">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge vault by keyword, insight, or tag..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar font-mono text-[11px]">
            {['all', 'directive', 'finding', 'summary', 'axiom', 'preference'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sound.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition border ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat + 's'}
              </button>
            ))}

            <button
              onClick={() => {
                sound.playClick();
                setShowPinnedOnly(!showPinnedOnly);
              }}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition border flex items-center gap-1 ${
                showPinnedOnly
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </button>
          </div>
        </div>

        {/* Semantic Tag Filter Pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[10px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Filter Tags:
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  sound.playClick();
                  setSelectedTag(selectedTag === tag ? null : tag);
                }}
                className={`px-2 py-0.5 rounded transition ${
                  selectedTag === tag
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-rose-400 hover:underline ml-1"
              >
                Reset tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main View: Constellation Graph Canvas OR Card Grid */}
      {viewMode === 'graph' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-300">
              <Compass className="w-4 h-4 text-cyan-400" />
              Synaptic Constellation Memory Visualizer
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Click any node to inspect memory parameters or toggle AI recall
            </span>
          </div>

          <div className="relative w-full h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-850">
            <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />

            {/* Selected Node Drawer overlay */}
            {selectedEntry && (
              <div className="absolute top-3 right-3 max-w-sm w-full bg-slate-900/95 border border-cyan-500/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-md space-y-2.5 font-mono text-xs z-10 animate-in fade-in slide-in-from-right-3">
                <div className="flex items-start justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryColor(
                      selectedEntry.category
                    )}`}
                  >
                    {selectedEntry.category}
                  </span>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <h4 className="font-bold text-slate-100 text-sm">{selectedEntry.title}</h4>
                <p className="text-slate-300 text-[11px] font-sans">{selectedEntry.summary}</p>

                <div className="bg-black/60 p-2 rounded text-[10px] text-slate-300 font-mono max-h-28 overflow-y-auto">
                  {selectedEntry.content}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Recalled: {selectedEntry.recallCount || 0} times</span>
                  <button
                    onClick={() => onRecallInChat(`Regarding the memory: "${selectedEntry.title}", recall and elaborate.`)}
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    Test In Chat <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center space-y-3">
              <Database className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-mono font-bold text-slate-300">
                No Knowledge Vault Entries Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No archived memories match your active filters. Click &quot;New Memory&quot; to archive a directive or &quot;Extract From Chat&quot; to auto-distill findings from previous interactions.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTag(null);
                  setShowPinnedOnly(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-mono"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredEntries.map((entry, idx) => (
                <div
                  key={`${entry.id}-${idx}`}
                  className={`bg-slate-900/80 border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 select-none ${
                    entry.pinned
                      ? 'border-amber-500/40 bg-gradient-to-br from-slate-900/90 to-amber-950/10'
                      : 'border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header tags & pin */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getCategoryColor(
                            entry.category
                          )}`}
                        >
                          {entry.category}
                        </span>

                        {entry.pinned && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-1 border border-amber-500/30">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-slate-500">
                          {entry.timestamp}
                        </span>
                      </div>

                      {/* Active in AI Recall Toggle */}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onUpdateEntry(entry.id, { activeInRecall: !entry.activeInRecall });
                        }}
                        title={
                          entry.activeInRecall
                            ? 'Currently active in AI recall context for future sessions'
                            : 'Muted: excluded from active AI recall context'
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition flex items-center gap-1.5 ${
                          entry.activeInRecall
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        <Brain className="w-3 h-3" />
                        <span>{entry.activeInRecall ? 'AI Recall: ON' : 'AI Recall: OFF'}</span>
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center justify-between">
                      <span>{entry.title}</span>
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {entry.summary}
                    </p>

                    {/* Expandable / Detailed Content Box */}
                    <div className="p-2.5 bg-black/60 rounded-lg border border-slate-850 font-mono text-[11px] text-cyan-200/90 leading-relaxed max-h-36 overflow-y-auto">
                      {entry.content}
                    </div>

                    {/* Semantic Tags */}
                    <div className="flex items-center flex-wrap gap-1 pt-1">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-slate-950 text-slate-400 border border-slate-850 rounded text-[9px] font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Recall Stats & Action Buttons */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 font-mono text-[11px]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="flex items-center gap-1 text-purple-400 font-bold">
                        <Activity className="w-3 h-3" /> Recalled {entry.recallCount || 0}x
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        Confidence: {entry.confidenceScore}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Pin/Unpin Toggle */}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onUpdateEntry(entry.id, { pinned: !entry.pinned });
                        }}
                        title={entry.pinned ? 'Unpin memory' : 'Pin memory as vital directive'}
                        className={`p-1.5 rounded hover:bg-slate-800 transition ${
                          entry.pinned ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Recall In Chat */}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRecallInChat(`Regarding the memory: "${entry.title}", recall and apply this.`);
                        }}
                        title="Query J.A.R.V.I.S. in Cognitive Chamber using this memory"
                        className="p-1.5 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Recall</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete memory "${entry.title}" from Knowledge Vault?`)) {
                            sound.playClick();
                            onDeleteEntry(entry.id);
                          }
                        }}
                        title="Delete from Knowledge Vault"
                        className="p-1.5 rounded hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Ingestion / New Memory Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100 uppercase">
                <Database className="w-4 h-4 text-cyan-400" />
                Ingest New Knowledge Vault Record
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Title / Finding Subject *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Safe Sandbox Protocol for Algorithmic Proofs"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Knowledge Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="finding">Finding (Verified Discovery)</option>
                    <option value="directive">Directive (Operator Mandate)</option>
                    <option value="summary">Summary (Interaction Recap)</option>
                    <option value="axiom">Axiom (Invariant Principle)</option>
                    <option value="preference">Preference (User Persona/Style)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Confidence Score (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">1-Line Summary</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Crisp high-level executive summary"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Distilled Knowledge Content *</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Provide the comprehensive finding, logical deductions, proof or constraint rules..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Semantic Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Security, Heuristic, Reasoning, Math"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg shadow-md shadow-cyan-500/20"
                >
                  Commit Memory to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
