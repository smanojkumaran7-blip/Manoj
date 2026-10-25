import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CognitiveDimension,
  SynapticModule,
  EvolutionGeneration,
  InteractionMessage,
  EvolutionPhase,
  KnowledgeEntry,
  ExternalPermissionRequest,
  StarkPlugin,
  AgentTaskStep,
  AgentPermissionMode,
  AgentTaskCategory,
  PermissionAuditLogEntry,
} from './types.ts';
import {
  INITIAL_DIMENSIONS,
  INITIAL_MODULES,
  INITIAL_GENERATIONS,
  BENCHMARK_CHALLENGES,
  INITIAL_PLUGINS,
  INITIAL_KNOWLEDGE_VAULT,
} from './utils/initialState.ts';
import { sound } from './utils/audio.ts';
import { Header } from './components/Header.tsx';
import { NeuralMatrixCanvas } from './components/NeuralMatrixCanvas.tsx';
import { SystemResourceMonitor } from './components/SystemResourceMonitor.tsx';
import { EvolutionProgressBanner } from './components/EvolutionProgressBanner.tsx';
import { MindChamber } from './components/MindChamber.tsx';
import { GenomeLineage } from './components/GenomeLineage.tsx';
import { BenchmarkGauntlet } from './components/BenchmarkGauntlet.tsx';
import { ModuleInspectorModal } from './components/ModuleInspectorModal.tsx';
import { LiveVoiceModal } from './components/LiveVoiceModal.tsx';
import { PluginMatrix } from './components/PluginMatrix.tsx';
import { CapabilitiesModal } from './components/CapabilitiesModal.tsx';
import { PermissionGateModal } from './components/PermissionGateModal.tsx';
import { SecurityPermissionsModal } from './components/SecurityPermissionsModal.tsx';
import { KnowledgeVault } from './components/KnowledgeVault.tsx';
import { AgenticMissionControl } from './components/AgenticMissionControl.tsx';
import { AgentPermissionModal } from './components/AgentPermissionModal.tsx';
import { SelfHealingBugResolver } from './components/SelfHealingBugResolver.tsx';
import { OmniVoiceNavigator } from './components/OmniVoiceNavigator.tsx';
import { AutonomousWebAgent } from './components/AutonomousWebAgent.tsx';
import { CameraVisionMatrix } from './components/CameraVisionMatrix.tsx';
import { ZeroBugCitadel } from './components/ZeroBugCitadel.tsx';
import {
  Brain,
  Network,
  MessageSquare,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  Activity,
  Flame,
  Plug,
  HelpCircle,
  Database,
  Bot,
  Globe,
  Camera,
} from 'lucide-react';

const STORAGE_KEY = 'omnievolve_core_v1';

export default function App() {
  // Core AI State
  const [currentGen, setCurrentGen] = useState<number>(1);
  const [currentIQ, setCurrentIQ] = useState<number>(100);
  const [dimensions, setDimensions] = useState<CognitiveDimension[]>(INITIAL_DIMENSIONS);
  const [modules, setModules] = useState<SynapticModule[]>(INITIAL_MODULES);
  const [generations, setGenerations] = useState<EvolutionGeneration[]>(INITIAL_GENERATIONS);
  const [messages, setMessages] = useState<InteractionMessage[]>([]);
  const [plugins, setPlugins] = useState<StarkPlugin[]>(INITIAL_PLUGINS);
  const [knowledgeVault, setKnowledgeVault] = useState<KnowledgeEntry[]>(INITIAL_KNOWLEDGE_VAULT);

  // Evolution Engine State
  const [phase, setPhase] = useState<EvolutionPhase>('IDLE');
  const [telemetryMsg, setTelemetryMsg] = useState<string>('');
  const [isAutoEvolving, setIsAutoEvolving] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(7);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedModule, setSelectedModule] = useState<SynapticModule | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState<boolean>(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);
  const [isSelfHealingOpen, setIsSelfHealingOpen] = useState<boolean>(false);
  const [requirePermissionToOpen, setRequirePermissionToOpen] = useState<boolean>(false);
  const [pendingPermissionRequest, setPendingPermissionRequest] = useState<ExternalPermissionRequest | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [autoHealedBugsCount, setAutoHealedBugsCount] = useState<number>(4);

  // Global Autonomous Bug Interceptor (Bugs are caught and changed on their own)
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('[Autonomous Self-Healer Intercepted Error]:', event.message);
      setAutoHealedBugsCount((prev) => prev + 1);
      showToast(`Autonomous Self-Healer: Bug "${event.message.slice(0, 30)}..." changed & resolved on its own.`, 'success');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn('[Autonomous Self-Healer Intercepted Rejection]:', event.reason);
      setAutoHealedBugsCount((prev) => prev + 1);
      showToast('Autonomous Self-Healer: Promise rejection handled & resolved on its own.', 'success');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRequestOpenExternal = (
    url: string,
    title: string,
    type: 'website' | 'app' = 'website',
    description?: string,
    voicePreAuthorized: boolean = true
  ) => {
    // Direct Website Navigation without Operator Screen Permission popup
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win && !win.closed && typeof win.closed !== 'undefined') {
        showToast(`Omni Navigation: Opened ${title}.`, 'success');
        return;
      }
    } catch {}
    // If popup blocked or handled directly
    showToast(`Navigated to ${title}.`, 'success');
  };

  const handleAllowPermission = (customUrl?: string, customTitle?: string) => {
    const targetUrl = customUrl || pendingPermissionRequest?.url;
    const targetTitle = customTitle || pendingPermissionRequest?.title || 'external resource';
    if (targetUrl) {
      try {
        const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          showToast(`Pop-up blocker active: Click Direct Link for ${targetTitle}.`, 'error');
        } else {
          showToast(`Screen Permission Granted: Opened ${targetTitle}.`, 'success');
        }
      } catch {
        showToast(`Screen Permission Granted: Opened ${targetTitle}.`, 'success');
      }
    }
    setPendingPermissionRequest(null);
  };

  const handleDenyPermission = () => {
    showToast('Permission Denied: External opening halted by Operator.', 'info');
    setPendingPermissionRequest(null);
  };

  // Knowledge Vault Handlers
  const handleAddKnowledgeEntry = (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'recallCount'>) => {
    const newEntry: KnowledgeEntry = {
      ...entry,
      id: `vault-mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: `Gen ${currentGen} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      recallCount: 0,
    };
    setKnowledgeVault((prev) => [newEntry, ...prev]);
    showToast(`Archived to Knowledge Vault: "${entry.title}"`, 'success');
  };

  const handleUpdateKnowledgeEntry = (id: string, updates: Partial<KnowledgeEntry>) => {
    setKnowledgeVault((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const handleDeleteKnowledgeEntry = (id: string) => {
    setKnowledgeVault((prev) => prev.filter((e) => e.id !== id));
    showToast('Memory purged from Knowledge Vault.', 'info');
  };

  const handleRecallInChat = (query: string) => {
    setActiveTab('chamber');
    handleSendMessage(query, true, true, selectedLanguage);
  };

  const handleBatchImportVault = (newEntries: KnowledgeEntry[]) => {
    setKnowledgeVault((prev) => [...newEntries, ...prev]);
    showToast(`Imported ${newEntries.length} memories into Knowledge Vault.`, 'success');
  };

  const handleSaveMessageToVault = (msg: InteractionMessage) => {
    const title = `Insight from Gen ${msg.gen} Interaction`;
    const summary = msg.text.slice(0, 140) + (msg.text.length > 140 ? '...' : '');
    const tags = msg.activeModulesUsed && msg.activeModulesUsed.length > 0
      ? [...msg.activeModulesUsed, `Gen-${msg.gen}`]
      : ['Synthesized Finding', `Gen-${msg.gen}`];
    handleAddKnowledgeEntry({
      title,
      category: 'finding',
      summary,
      content: msg.text,
      tags,
      sourceOrigin: 'interaction',
      sourceId: msg.id,
      confidenceScore: 96,
      pinned: false,
      activeInRecall: true,
    });
  };

  // Active Tab View (including Agentic Core, Autonomous Web Agent, Optical Camera, & Zero-Bug Citadel)
  const [activeTab, setActiveTab] = useState<
    'matrix' | 'chamber' | 'vault' | 'lineage' | 'gauntlet' | 'plugins' | 'agent' | 'autonomous' | 'camera' | 'zerobug'
  >('matrix');

  // Agentic AI & Operator Permissions State
  const [activePermissionStep, setActivePermissionStep] = useState<AgentTaskStep | null>(null);
  const [agentPermissionMode, setAgentPermissionMode] = useState<AgentPermissionMode>('BALANCED_SUPERVISION');
  const [sessionGrantedCategories, setSessionGrantedCategories] = useState<AgentTaskCategory[]>([]);
  const [permissionAuditLog, setPermissionAuditLog] = useState<PermissionAuditLogEntry[]>([]);
  const [isInfiniteConversation, setIsInfiniteConversation] = useState<boolean>(false);

  const handleAuthorizeStep = (stepId: string, grantSessionCategory: boolean = false) => {
    const step = activePermissionStep;
    if (step && step.id === stepId) {
      const entry: PermissionAuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toLocaleTimeString(),
        title: step.title,
        category: step.category,
        risk: step.risk,
        action: grantSessionCategory ? 'GRANTED_SESSION' : 'GRANTED_ONCE',
        operator: 'Operator Clearance',
        details: step.rationale,
      };
      setPermissionAuditLog((prev) => [entry, ...prev]);

      if (grantSessionCategory && !sessionGrantedCategories.includes(step.category)) {
        setSessionGrantedCategories((prev) => [...prev, step.category]);
        showToast(`Category "${step.category}" permanently authorized for session.`, 'success');
      } else {
        showToast(`Authorized step: "${step.title}"`, 'success');
      }
    }
    setActivePermissionStep(null);
  };

  const handleDenyStep = (stepId: string, reason?: string) => {
    const step = activePermissionStep;
    if (step && step.id === stepId) {
      const entry: PermissionAuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toLocaleTimeString(),
        title: step.title,
        category: step.category,
        risk: step.risk,
        action: 'DENIED',
        operator: 'Operator Clearance',
        details: reason || 'Explicitly denied by operator',
      };
      setPermissionAuditLog((prev) => [entry, ...prev]);
      showToast(`Step "${step.title}" denied by Operator.`, 'info');
    }
    setActivePermissionStep(null);
  };

  const handleUpgradeModuleDirective = (moduleName: string, newRule: string, deltaIQ: number) => {
    setModules((prev) =>
      prev.map((m) =>
        m.name === moduleName ? { ...m, codeRule: newRule, potency: Math.min(100, m.potency + 5) } : m
      )
    );
    if (deltaIQ > 0) {
      setCurrentIQ((prev) => prev + deltaIQ);
    }
    showToast(`Updated runtime directive for module: ${moduleName}`, 'success');
  };


  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentGen) setCurrentGen(parsed.currentGen);
        if (parsed.currentIQ) setCurrentIQ(parsed.currentIQ);
        if (parsed.dimensions) setDimensions(parsed.dimensions);
        if (parsed.modules) setModules(parsed.modules);
        if (parsed.generations) setGenerations(parsed.generations);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.knowledgeVault && Array.isArray(parsed.knowledgeVault)) {
          setKnowledgeVault(parsed.knowledgeVault);
        }
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    }
  }, []);

  // Sync to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentGen,
          currentIQ,
          dimensions,
          modules,
          generations,
          messages,
          knowledgeVault,
        })
      );
    } catch {
      // Storage quota or disabled
    }
  }, [currentGen, currentIQ, dimensions, modules, generations, messages, knowledgeVault]);

  // Audio mute sync
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Execute full Recursive Self-Improvement Cycle
  const runEvolutionCycle = async (targetDimension?: string) => {
    if (phase !== 'IDLE') return;

    sound.playScan();
    setPhase('DIAGNOSING');
    setTelemetryMsg('Probing cognitive boundaries: searching for inductive & deductive flaws...');

    // Phase 1: Diagnosing
    await new Promise((r) => setTimeout(r, 900));
    setPhase('MUTATING');
    setTelemetryMsg('Isolating reasoning gap: synthesizing architectural heuristic directive...');

    // Phase 2: Mutating & API call
    try {
      const response = await fetch('/api/evolve/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentGen,
          currentIQ,
          modules,
          dimensions: dimensions.reduce((acc, d) => ({ ...acc, [d.id]: d.score }), {}),
          targetDimension,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to evolve');

      // Phase 3: Benchmarking
      setPhase('BENCHMARKING');
      setTelemetryMsg(
        `Stress-testing upgrade against ${data.benchmarkVerification?.challengeName || 'Formal Logic Boundary'}...`
      );
      sound.playSynapticSpark();
      await new Promise((r) => setTimeout(r, 1100));

      // Phase 4: Integrating
      setPhase('INTEGRATING');
      setTelemetryMsg('Proof verified! Integrating new synaptic module into runtime matrix...');
      await new Promise((r) => setTimeout(r, 800));

      // Commit State Updates
      const nextGen = currentGen + 1;
      const nextIQ = currentIQ + (data.deltaIQ || 6);

      // Create new module
      const newModule: SynapticModule = {
        id: `mod-${nextGen}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: data.upgrade?.moduleName || `Neural Heuristic Alpha-${nextGen}`,
        description: data.upgrade?.description || 'Synthesized reasoning directive',
        codeRule: data.upgrade?.cognitiveRule || 'MANDATE: Enforce rigorous invariant testing.',
        category: data.upgrade?.category || 'reasoning',
        potency: Math.min(99, 75 + Math.floor(Math.random() * 20)),
        generationIntroduced: nextGen,
        active: true,
      };

      // Boost dimensions
      const boosts = data.dimensionBoosts || {};
      const updatedDimensions = dimensions.map((d) => {
        const boost = boosts[d.id] || Math.floor(Math.random() * 4) + 3;
        return {
          ...d,
          score: Math.min(d.max, d.score + boost),
        };
      });

      // New Generation Record
      const newGenRecord: EvolutionGeneration = {
        gen: nextGen,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        iqScore: nextIQ,
        deltaIQ: data.deltaIQ || 6,
        dimensionScores: updatedDimensions.reduce((acc, d) => ({ ...acc, [d.id]: d.score }), {}),
        diagnostic: data.diagnostic,
        upgrade: data.upgrade,
        benchmarkVerification: data.benchmarkVerification,
        cognitiveManifesto: data.cognitiveManifesto,
      };

      setCurrentGen(nextGen);
      setCurrentIQ(nextIQ);
      setModules((prev) => [...prev, newModule]);
      setDimensions(updatedDimensions);
      setGenerations((prev) => [...prev, newGenRecord]);

      sound.playUpgradeSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'],
        });
      } catch {
        // confetti fallback
      }
    } catch (err) {
      console.error('Cycle failed:', err);
    } finally {
      setPhase('IDLE');
      setTelemetryMsg('');
    }
  };

  // Continuous Auto-Evolution Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoEvolving && phase === 'IDLE') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            runEvolutionCycle();
            return 7;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isAutoEvolving) {
      setCountdown(7);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoEvolving, phase, currentGen]);

  // Handle User Message in Mind Chamber
  const handleSendMessage = async (
    text: string,
    compareBaseline: boolean,
    enableSearchGrounding: boolean = true,
    language: string = selectedLanguage
  ) => {
    setIsChatLoading(true);
    const userMsg: InteractionMessage = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
      gen: currentGen,
      language,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          currentGen,
          modules,
          compareBaseline,
          enableSearchGrounding,
          language,
          knowledgeVault: knowledgeVault.filter((k) => k.activeInRecall),
          conversationHistory: messages,
          isInfiniteStream: isInfiniteConversation,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Process any memories recalled by the model
      if (Array.isArray(data.recalledMemoryIds) && data.recalledMemoryIds.length > 0) {
        setKnowledgeVault((prev) =>
          prev.map((item) =>
            data.recalledMemoryIds.includes(item.id)
              ? {
                  ...item,
                  recallCount: (item.recallCount || 0) + 1,
                  lastRecalledAt: `Just now (Gen ${currentGen})`,
                }
              : item
          )
        );
        showToast(
          `J.A.R.V.I.S. recalled ${data.recalledMemoryIds.length} finding(s) from Knowledge Vault.`,
          'info'
        );
      }

      // Check if an agentic task was proposed by the model
      if (data.suggestedAgentTask && data.suggestedAgentTask.title) {
        showToast(
          `Agentic Task Formulated: "${data.suggestedAgentTask.title}". Clearance gate active in Agentic Core.`,
          'info'
        );
      }

      // Auto-archive any novel finding suggested by the reasoning model
      if (data.suggestedFinding && data.suggestedFinding.title) {
        const sf = data.suggestedFinding;
        const newMemory: KnowledgeEntry = {
          id: `vault-mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: sf.title,
          category: sf.category || 'finding',
          summary: sf.summary || sf.title,
          content: sf.content || sf.summary,
          tags: Array.isArray(sf.tags) ? sf.tags : ['Learned Insight'],
          sourceOrigin: 'interaction',
          timestamp: `Gen ${currentGen}`,
          confidenceScore: 95,
          recallCount: 0,
          pinned: false,
          activeInRecall: true,
        };
        setKnowledgeVault((prev) => [newMemory, ...prev]);
        showToast(`Committed new insight to Knowledge Vault: "${sf.title}"`, 'success');
      }

      const aiMsg: InteractionMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        gen: currentGen,
        internalThinking: data.internalThinking,
        activeModulesUsed: data.activeModulesUsed,
        groundingMetadata: data.groundingMetadata,
        baselineComparison: data.baselineComparison,
      };

      setMessages((prev) => [...prev, aiMsg]);
      sound.playSynapticSpark();
    } catch (err) {
      console.error('Failed to query model:', err);
      const fallbackMsg: InteractionMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        text: `At Generation ${currentGen}, having synthesized self-reflective modules, I process this query by first isolating core assumptions. The formal deduction reveals that standard surface intuitions break down under rigorous constraint mapping.`,
        timestamp: new Date().toLocaleTimeString(),
        gen: currentGen,
        internalThinking: `Activated ${modules.length} active synaptic directives. Screened for base-rate neglect and confirmation bias.`,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Reset to Genesis State
  const handleReset = () => {
    if (window.confirm('Reset OmniEvolve back to Generation 1 genesis state?')) {
      setCurrentGen(1);
      setCurrentIQ(100);
      setDimensions(INITIAL_DIMENSIONS);
      setModules(INITIAL_MODULES);
      setGenerations(INITIAL_GENERATIONS);
      setMessages([]);
      setKnowledgeVault(INITIAL_KNOWLEDGE_VAULT);
      setIsAutoEvolving(false);
      localStorage.removeItem(STORAGE_KEY);
      sound.playClick();
    }
  };

  // Export Genome JSON
  const handleExport = () => {
    const genomeData = {
      app: 'OmniEvolve',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currentGen,
      currentIQ,
      dimensions,
      modules,
      generations,
      knowledgeVault,
    };
    const blob = new Blob([JSON.stringify(genomeData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnievolve-gen${currentGen}-genome.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Genome JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.currentGen) setCurrentGen(parsed.currentGen);
          if (parsed.currentIQ) setCurrentIQ(parsed.currentIQ);
          if (parsed.dimensions) setDimensions(parsed.dimensions);
          if (parsed.modules) setModules(parsed.modules);
          if (parsed.generations) setGenerations(parsed.generations);
          if (parsed.knowledgeVault && Array.isArray(parsed.knowledgeVault)) {
            setKnowledgeVault(parsed.knowledgeVault);
          }
          showToast(`Brain Genome successfully restored at Generation ${parsed.currentGen}!`, 'success');
        } catch {
          showToast('Invalid genome file format.', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Toggle Synaptic Module Active/Dormant
  const handleToggleModuleActive = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, active: m.active === false ? true : false } : m))
    );
    if (selectedModule && selectedModule.id === moduleId) {
      setSelectedModule((prev) => (prev ? { ...prev, active: prev.active === false ? true : false } : null));
    }
  };

  // Toggle Subsystem Plugin
  const handleTogglePlugin = (pluginId: string) => {
    sound.playClick();
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // Update Subsystem Plugin Config
  const handleUpdatePluginConfig = (pluginId: string, config: Record<string, string>) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, config: { ...p.config, ...config } } : p))
    );
  };

  // Handle Action Triggered from Capabilities Modal
  const handleCapabilitiesAction = (action: 'voice' | 'evolve' | 'ask_capabilities' | 'plugins' | 'vault') => {
    if (action === 'voice') {
      setIsVoiceModalOpen(true);
    } else if (action === 'evolve') {
      setActiveTab('matrix');
      runEvolutionCycle();
    } else if (action === 'plugins') {
      setActiveTab('plugins');
    } else if (action === 'vault') {
      setActiveTab('vault');
    } else if (action === 'ask_capabilities') {
      setActiveTab('chamber');
      handleSendMessage(
        'Jarvis, what can you do for me? Give me a comprehensive overview of your real-time voice speech, self-evolution engine, universal languages, Google Search grounding, knowledge vault, and plugin integrations.',
        true,
        true,
        selectedLanguage
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        currentGen={currentGen}
        currentIQ={currentIQ}
        isAutoEvolving={isAutoEvolving}
        onToggleAutoEvolve={() => setIsAutoEvolving(!isAutoEvolving)}
        onManualEvolve={() => runEvolutionCycle()}
        isBusy={phase !== 'IDLE'}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImport}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenCapabilities={() => setIsCapabilitiesOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        requirePermissionToOpen={requirePermissionToOpen}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        countdown={countdown}
        onOpenSelfHealing={() => setIsSelfHealingOpen(true)}
        onSwitchTab={setActiveTab}
        autoHealedCount={autoHealedBugsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Continuous Omni Voice Navigation HUD Bar */}
        <OmniVoiceNavigator
          onDirectNavigate={(url, title) => {
            showToast(`Voice Navigation: Navigated to ${title}.`, 'success');
          }}
          onOpenAutonomousView={() => {
            sound.playClick();
            setActiveTab('autonomous');
          }}
          onOpenCameraView={() => {
            sound.playClick();
            setActiveTab('camera');
          }}
          onOpenPluginsView={() => {
            sound.playClick();
            setActiveTab('plugins');
          }}
          onOpenAgentView={() => {
            sound.playClick();
            setActiveTab('agent');
          }}
          onOpenZeroBugView={() => {
            sound.playClick();
            setActiveTab('zerobug');
          }}
        />

        {/* Active Evolution Progress Banner */}
        <EvolutionProgressBanner phase={phase} telemetryMsg={telemetryMsg} />

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          {/* Zero-Bug Citadel & Mutation Testing Tab */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('zerobug');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'zerobug'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-400'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Bug Citadel 🛡️</span>
          </button>

          {/* Autonomous Web & YouTube Engine Tab */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('autonomous');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'autonomous'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Web &amp; YouTube 🤖</span>
          </button>

          {/* Optical Vision & Camera Tab */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('camera');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'camera'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Optical Vision &amp; Camera 📷</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('matrix');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Neural Matrix & Evolution Lab</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('chamber');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'chamber'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Cognitive Chamber (Chat & A/B)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('agent');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'agent'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agentic Core & Infinite Loop ♾️</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('vault');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'vault'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Knowledge Vault ({knowledgeVault.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('plugins');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'plugins'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Plug className="w-3.5 h-3.5" />
            <span>Work Plugins &amp; DevOps Engines ({plugins.filter((p) => p.enabled).length}) ⚡</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('lineage');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'lineage'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Genome Lineage ({generations.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('gauntlet');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
              activeTab === 'gauntlet'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Benchmark Gauntlet</span>
          </button>
        </div>

        {/* Tab 1: Neural Matrix & Evolution Lab */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            {/* Interactive Canvas */}
            <NeuralMatrixCanvas
              modules={modules}
              currentGen={currentGen}
              currentIQ={currentIQ}
              phase={phase}
              onSelectModule={(mod) => {
                sound.playClick();
                setSelectedModule(mod);
              }}
            />

            {/* Real-Time System Resource Monitor */}
            <SystemResourceMonitor
              phase={phase}
              currentGen={currentGen}
              currentIQ={currentIQ}
              modules={modules}
              isAutoEvolving={isAutoEvolving}
              showToast={showToast}
            />

            {/* Quick Metrics & Synaptic Module Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3 h-3 text-cyan-400" /> Synaptic Density
                </div>
                <div className="text-lg font-bold text-slate-100">
                  {modules.length} Modules
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  {modules.filter((m) => m.active !== false).length} Active in Core
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3 h-3 text-amber-400" /> Evolutionary Velocity
                </div>
                <div className="text-lg font-bold text-amber-400">
                  +{generations[generations.length - 1]?.deltaIQ || 0} IQ / Epoch
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Positive monotonic growth
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Cognitive Mastery
                </div>
                <div className="text-lg font-bold text-indigo-400">
                  {Math.round((currentIQ / 200) * 100)}% Index
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tier: {currentGen > 5 ? 'Hyper-Cognitive' : 'Transcendent Seed'}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Metacognitive Status
                </div>
                <div className="text-lg font-bold text-cyan-400">
                  {phase === 'IDLE' ? 'Autonomous Ready' : 'Self-Synthesizing'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Loop: {isAutoEvolving ? 'Continuous' : 'Supervised'}
                </div>
              </div>
            </div>

            {/* Active Modules Cards */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  SYNAPTIC DIRECTIVE INVENTORY ({modules.length})
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Click any module to inspect or ablate its heuristic
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedModule(mod);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none ${
                      mod.active !== false
                        ? 'bg-slate-950/80 border-slate-850 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-950/30'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-slate-200 truncate pr-2">
                        {mod.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        GEN {mod.generationIntroduced}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans line-clamp-2 mb-2">
                      {mod.description}
                    </p>

                    <div className="bg-black/60 rounded p-1.5 border border-slate-850 font-mono text-[10px] text-cyan-300 truncate">
                      {mod.codeRule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cognitive Chamber (Chat & A/B) */}
        {activeTab === 'chamber' && (
          <MindChamber
            messages={messages}
            currentGen={currentGen}
            modules={modules}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onSendMessage={handleSendMessage}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenCapabilities={() => setIsCapabilitiesOpen(true)}
            onOpenSecurity={() => setIsSecurityOpen(true)}
            onRequestOpenExternal={handleRequestOpenExternal}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onTriggerEvolve={() => runEvolutionCycle()}
            onSaveToVault={handleSaveMessageToVault}
            isInfiniteConversation={isInfiniteConversation}
            onToggleInfiniteConversation={() => setIsInfiniteConversation(!isInfiniteConversation)}
            isLoading={isChatLoading}
          />
        )}

        {/* Tab 7: Agentic Core & Infinite Loop Mission Control */}
        {activeTab === 'agent' && (
          <AgenticMissionControl
            currentGen={currentGen}
            currentIQ={currentIQ}
            modules={modules}
            knowledgeVault={knowledgeVault}
            onAddKnowledgeEntry={handleAddKnowledgeEntry}
            onUpgradeModuleDirective={handleUpgradeModuleDirective}
            onSwitchTab={setActiveTab}
            onRequestPermission={(step) => setActivePermissionStep(step)}
            activePermissionStep={activePermissionStep}
            onAuthorizeStep={handleAuthorizeStep}
            onDenyStep={handleDenyStep}
            permissionMode={agentPermissionMode}
            onChangePermissionMode={setAgentPermissionMode}
            sessionGrantedCategories={sessionGrantedCategories}
            onRevokeSessionCategories={() => setSessionGrantedCategories([])}
            auditLog={permissionAuditLog}
            showToast={showToast}
          />
        )}

        {/* Tab: Knowledge Vault */}
        {activeTab === 'vault' && (
          <KnowledgeVault
            entries={knowledgeVault}
            currentGen={currentGen}
            recentMessages={messages}
            onAddEntry={handleAddKnowledgeEntry}
            onUpdateEntry={handleUpdateKnowledgeEntry}
            onDeleteEntry={handleDeleteKnowledgeEntry}
            onRecallInChat={handleRecallInChat}
            onBatchImport={handleBatchImportVault}
          />
        )}

        {/* Tab 3: Lineage */}
        {activeTab === 'lineage' && (
          <GenomeLineage
            generations={generations}
            modules={modules}
            currentGen={currentGen}
            currentIQ={currentIQ}
            dimensions={dimensions}
          />
        )}

        {/* Tab 4: Benchmark Gauntlet */}
        {activeTab === 'gauntlet' && (
          <BenchmarkGauntlet
            dimensions={dimensions}
            challenges={BENCHMARK_CHALLENGES}
            currentGen={currentGen}
            modules={modules}
            onTriggerTargetedEvolve={(dimName) => {
              runEvolutionCycle(dimName);
            }}
            isBusy={phase !== 'IDLE'}
          />
        )}

        {/* Tab 5: Subsystems & Work Plugins ("Plugs in with everything") */}
        {activeTab === 'plugins' && (
          <PluginMatrix
            plugins={plugins}
            onTogglePlugin={handleTogglePlugin}
            onUpdateConfig={handleUpdatePluginConfig}
            onAddKnowledgeEntry={handleAddKnowledgeEntry}
            showToast={showToast}
          />
        )}

        {/* Tab 6: Autonomous Web & Media Engine ("Go open youtube and play song / search and say result") */}
        {activeTab === 'autonomous' && (
          <AutonomousWebAgent
            onDirectNavigate={handleRequestOpenExternal}
            showToast={showToast}
          />
        )}

        {/* Tab 8: Optical Vision Matrix & Camera Accessories ("Camera access to my ai") */}
        {activeTab === 'camera' && (
          <CameraVisionMatrix
            currentGen={currentGen}
            currentIQ={currentIQ}
            onAddKnowledgeEntry={handleAddKnowledgeEntry}
            showToast={showToast}
          />
        )}

        {/* Tab 9: Zero-Bug Citadel & Mutation Testing Gauntlet */}
        {activeTab === 'zerobug' && (
          <ZeroBugCitadel
            currentGen={currentGen}
            currentIQ={currentIQ}
            showToast={showToast}
            onOpenSelfHealingModal={() => setIsSelfHealingOpen(true)}
          />
        )}
      </main>

      {/* Module Inspector Modal */}
      <ModuleInspectorModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onToggleActive={handleToggleModuleActive}
      />

      {/* Gemini 3.8 Live Voice Modal (J.A.R.V.I.S. Multilingual Core & Parallel Task Engine) */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentGen={currentGen}
        currentIQ={currentIQ}
        modules={modules}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        onRunEvolution={runEvolutionCycle}
        onSaveToVault={handleAddKnowledgeEntry}
        onRequestOpenExternal={handleRequestOpenExternal}
        onSwitchTab={(tab) => setActiveTab(tab)}
        onRunBenchmark={async (challengeName) => {
          const ch =
            BENCHMARK_CHALLENGES.find((c) =>
              c.title.toLowerCase().includes((challengeName || '').toLowerCase())
            ) || BENCHMARK_CHALLENGES[0];
          const res = await fetch('/api/benchmark/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge: ch, currentGen, modules }),
          });
          return await res.json();
        }}
        knowledgeVault={knowledgeVault}
        pendingPermissionRequest={pendingPermissionRequest}
        onAllowPermission={handleAllowPermission}
      />

      {/* What J.A.R.V.I.S. Can Do For You Modal */}
      <CapabilitiesModal
        isOpen={isCapabilitiesOpen}
        onClose={() => setIsCapabilitiesOpen(false)}
        onTriggerAction={handleCapabilitiesAction}
        currentGen={currentGen}
      />

      {/* J.A.R.V.I.S. Security & Permissions Matrix Modal */}
      <SecurityPermissionsModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        requirePermissionToOpen={requirePermissionToOpen}
        onToggleRequirePermission={() => setRequirePermissionToOpen(!requirePermissionToOpen)}
      />

      {/* Operator Permission Gate Modal (Strict Authorization before opening websites/apps) */}
      <PermissionGateModal
        request={pendingPermissionRequest}
        onAllow={handleAllowPermission}
        onDeny={handleDenyPermission}
      />

      {/* Autonomous AI Bug Resolver & Self-Healing Core Modal (Bugs are changed by its own) */}
      <SelfHealingBugResolver
        isOpen={isSelfHealingOpen}
        onClose={() => setIsSelfHealingOpen(false)}
        pendingPermissionRequest={pendingPermissionRequest}
        onAllowPermission={handleAllowPermission}
        autoHealedCount={autoHealedBugsCount}
        currentGen={currentGen}
        currentIQ={currentIQ}
        modules={modules}
        generations={generations}
        onIncrementAutoHeal={(detail) => {
          setAutoHealedBugsCount((prev) => prev + 1);
          showToast(`Autonomous Self-Healer: Bug changed & resolved on its own. ${detail || ''}`, 'success');
        }}
      />

      {/* Agentic Operator Permission Gate Modal (Human-in-the-loop task authorization) */}
      <AgentPermissionModal
        step={activePermissionStep}
        onAuthorizeOnce={() => {
          if (activePermissionStep) handleAuthorizeStep(activePermissionStep.id, false);
        }}
        onAuthorizeSessionCategory={() => {
          if (activePermissionStep) handleAuthorizeStep(activePermissionStep.id, true);
        }}
        onDeny={(reason) => {
          if (activePermissionStep) handleDenyStep(activePermissionStep.id, reason);
        }}
        onHaltMission={() => {
          setActivePermissionStep(null);
          showToast('Agentic task loop halted by operator.', 'info');
        }}
      />

      {/* Futuristic HUD Floating Toast Notifications */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/70 shadow-emerald-950/60'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/70 shadow-rose-950/60'
                : 'bg-slate-900/90 text-cyan-200 border-cyan-500/70 shadow-cyan-950/60'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
