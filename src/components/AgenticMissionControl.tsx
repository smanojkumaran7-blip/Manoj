import React, { useState, useEffect, useRef } from 'react';
import {
  InfiniteAgentMission,
  AgentTaskStep,
  AgentTaskCategory,
  AgentTaskRisk,
  AgentPermissionMode,
  PermissionAuditLogEntry,
  KnowledgeEntry,
  SynapticModule,
} from '../types.ts';
import { AGENT_MISSION_PRESETS, AgentMissionPreset } from '../utils/initialState.ts';
import { sound } from '../utils/audio.ts';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Brain,
  Database,
  Terminal,
  Activity,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';

interface AgenticMissionControlProps {
  currentGen: number;
  currentIQ: number;
  modules: SynapticModule[];
  knowledgeVault: KnowledgeEntry[];
  onAddKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'recallCount'>) => void;
  onUpgradeModuleDirective?: (moduleName: string, newRule: string, deltaIQ: number) => void;
  onSwitchTab?: (tab: 'matrix' | 'chamber' | 'vault' | 'lineage' | 'gauntlet' | 'plugins' | 'agent') => void;
  onRequestPermission: (step: AgentTaskStep) => void;
  activePermissionStep: AgentTaskStep | null;
  onAuthorizeStep: (stepId: string, grantSessionCategory?: boolean) => void;
  onDenyStep: (stepId: string, reason?: string) => void;
  permissionMode: AgentPermissionMode;
  onChangePermissionMode: (mode: AgentPermissionMode) => void;
  sessionGrantedCategories: AgentTaskCategory[];
  onRevokeSessionCategories: () => void;
  auditLog: PermissionAuditLogEntry[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgenticMissionControl: React.FC<AgenticMissionControlProps> = ({
  currentGen,
  currentIQ,
  modules,
  knowledgeVault,
  onAddKnowledgeEntry,
  onUpgradeModuleDirective,
  onSwitchTab,
  onRequestPermission,
  activePermissionStep,
  onAuthorizeStep,
  onDenyStep,
  permissionMode,
  onChangePermissionMode,
  sessionGrantedCategories,
  onRevokeSessionCategories,
  auditLog,
  showToast,
}) => {
  // Mission configuration state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(AGENT_MISSION_PRESETS[0].id);
  const [customGoal, setCustomGoal] = useState<string>('');
  const [useCustomGoal, setUseCustomGoal] = useState<boolean>(false);
  const [infiniteLoopActive, setInfiniteLoopActive] = useState<boolean>(false);
  const [cycleCadenceSeconds, setCycleCadenceSeconds] = useState<number>(3); // delay between steps
  const [isFormulatingPlan, setIsFormulatingPlan] = useState<boolean>(false);
  const [isExecutingStep, setIsExecutingStep] = useState<boolean>(false);

  // Active mission state
  const [mission, setMission] = useState<InfiniteAgentMission>({
    id: 'mission-infinite-1',
    title: AGENT_MISSION_PRESETS[0].title,
    goal: AGENT_MISSION_PRESETS[0].goal,
    mode: 'INFINITE_AUTONOMOUS',
    status: 'IDLE',
    currentCycle: 1,
    totalStepsCompleted: 0,
    totalPermissionsRequested: 0,
    totalPermissionsApproved: 0,
    totalPermissionsDenied: 0,
    activeSteps: [],
    stepHistory: [],
    discoveredAxioms: [],
    lastActivity: 'Initialized',
    permissionMode: permissionMode,
    sessionGrantedCategories: sessionGrantedCategories,
  });

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);
  const [showConfigAccordion, setShowConfigAccordion] = useState<boolean>(false);
  const executionTimerRef = useRef<any>(null);

  // Sync permissionMode prop to mission
  useEffect(() => {
    setMission((prev) => ({
      ...prev,
      permissionMode,
      sessionGrantedCategories,
    }));
  }, [permissionMode, sessionGrantedCategories]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: AgentMissionPreset) => {
    setSelectedPresetId(preset.id);
    setUseCustomGoal(false);
    setMission((prev) => ({
      ...prev,
      title: preset.title,
      goal: preset.goal,
    }));
    sound.playClick();
  };

  // Plan or Re-plan Cycle
  const formulateCyclePlan = async (cycleNum: number, prevSummary: string = '') => {
    setIsFormulatingPlan(true);
    sound.playScan();
    try {
      const response = await fetch('/api/agent/plan-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionGoal: mission.goal,
          cycleNumber: cycleNum,
          currentGen,
          currentIQ,
          modules,
          knowledgeVault,
          previousResults: prevSummary,
          permissionMode: mission.permissionMode,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to formulate cycle plan');

      const steps: AgentTaskStep[] = data.steps;

      setMission((prev) => ({
        ...prev,
        currentCycle: cycleNum,
        activeSteps: steps,
        status: infiniteLoopActive ? 'RUNNING' : 'IDLE',
        lastActivity: `Formulated Cycle ${cycleNum} with ${steps.length} autonomous steps.`,
      }));

      setActiveStepIndex(0);
      showToast(`Cycle ${cycleNum} formulated: ${steps.length} agent steps generated.`, 'info');
    } catch (err: any) {
      console.warn('Plan formulation note, using local cognitive architecture:', err?.message || err);
      const isDevOps =
        mission.goal.toLowerCase().includes('devops') ||
        mission.goal.toLowerCase().includes('api') ||
        mission.goal.toLowerCase().includes('code') ||
        mission.goal.toLowerCase().includes('pipeline') ||
        mission.goal.toLowerCase().includes('latency') ||
        mission.goal.toLowerCase().includes('adr');

      const fallbackSteps: AgentTaskStep[] = isDevOps
        ? [
            {
              id: `step-${Date.now()}-${cycleNum}-1-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 1,
              title: `Cycle ${cycleNum}: Automated Code & Script Sandbox Execution`,
              description: `Execute sandboxed unit tests and benchmark SLA latency calculations across microservices.`,
              category: 'DEVOPS_AUTOMATION',
              risk: 'MEDIUM',
              actionType: 'EXECUTE_TERMINAL_TEST',
              rationale: 'Verifies non-blocking execution, error boundary resilience, and validates algorithm performance.',
              potentialImpact: 'Catches runtime exceptions and proves mathematical latency bounds.',
              targetPayload: { language: 'javascript', timeoutMs: 4000 },
              status: 'QUEUED',
            },
            {
              id: `step-${Date.now()}-${cycleNum}-2-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 2,
              title: `Cycle ${cycleNum}: Technical RFC & Documentation Research`,
              description: `Crawl technical specifications and developer documentation (MDN, GitHub, RFCs) to synthesize verified best practices.`,
              category: 'DEEP_RESEARCH',
              risk: 'LOW',
              actionType: 'QUERY_TECHNICAL_DOCS',
              rationale: 'Grounds architectural upgrades in industry standards, eliminating hallucinations.',
              potentialImpact: 'Supplies verified code patterns and cited references.',
              targetPayload: { targetDomain: 'github', depth: 'deep' },
              status: 'QUEUED',
            },
            {
              id: `step-${Date.now()}-${cycleNum}-3-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 3,
              title: `Cycle ${cycleNum}: Telemetry Analytics & Latency Distribution Evaluation`,
              description: `Ingest service telemetry CSV data, compute p50/p95/p99 distributions, and detect regression anomalies.`,
              category: 'DATA_ANALYTICS',
              risk: 'LOW',
              actionType: 'ANALYZE_SERVICE_LATENCY',
              rationale: 'Ensures cluster services operate strictly within the 99.9% SLO error budget.',
              potentialImpact: 'Generates statistical benchmarks and interactive SVG latency charts.',
              targetPayload: { dataset: 'devops_telemetry' },
              status: 'QUEUED',
            },
            {
              id: `step-${Date.now()}-${cycleNum}-4-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 4,
              title: `Cycle ${cycleNum}: Architecture Decision Record (ADR) Vault Archival`,
              description: `Compile a formal RFC-compliant Architecture Decision Record and permanently record standards in the Knowledge Vault.`,
              category: 'VAULT_ARCHIVE',
              risk: 'HIGH',
              actionType: 'COMPILE_ADR_RECORD',
              rationale: 'Preserves verified engineering decisions with immutable timestamps and operator clearance.',
              potentialImpact: 'Permanently updates the Knowledge Vault with zero-drift technical documentation.',
              targetPayload: { cycle: cycleNum, category: 'Architecture Decision Record' },
              status: 'QUEUED',
            },
          ]
        : [
            {
              id: `step-${Date.now()}-${cycleNum}-1-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 1,
              title: `Cycle ${cycleNum}: Epistemic Boundary Audit`,
              description: `Analyze current synthetic reasoning directives under mission goal: "${mission.goal.slice(0, 40)}..."`,
              category: 'DEEP_RESEARCH',
              risk: 'LOW',
              actionType: 'AUDIT_PREMISES',
              rationale: 'Establish verified premises before synthesizing higher-order computational models.',
              potentialImpact: 'Isolates hidden inductive fallacies and calibrates baseline confidence.',
              targetPayload: { cycle: cycleNum, target: mission.goal },
              status: 'QUEUED',
            },
            {
              id: `step-${Date.now()}-${cycleNum}-2-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 2,
              title: `Cycle ${cycleNum}: Axiomatic Theorem Synthesis`,
              description: `Distill cross-domain invariant relations and formulate high-order theorem.`,
              category: 'KNOWLEDGE_SYNTHESIS',
              risk: 'MEDIUM',
              actionType: 'SYNTHESIZE_AXIOM',
              rationale: 'Generates permanent cognitive assets to be archived into the permanent Knowledge Vault.',
              potentialImpact: 'Creates a new indexed Knowledge Vault entry available for immediate recall.',
              targetPayload: { cycle: cycleNum, type: 'axiom' },
              status: 'QUEUED',
            },
            {
              id: `step-${Date.now()}-${cycleNum}-3-${Math.random().toString(36).substring(2, 7)}`,
              stepNumber: 3,
              title: `Cycle ${cycleNum}: Neural Matrix Heuristic Optimization`,
              description: `Mutate active synaptic directive to permanently retain the newly proven operational heuristic.`,
              category: 'SYSTEM_MUTATION',
              risk: 'HIGH',
              actionType: 'MUTATE_DIRECTIVE',
              rationale: 'Recursively upgrades J.A.R.V.I.S. runtime decision matrix for subsequent infinite cycles.',
              potentialImpact: 'Directly alters runtime cognitive heuristics and increases Synthetic IQ.',
              targetPayload: { cycle: cycleNum, deltaIQ: 4 },
              status: 'QUEUED',
            },
          ];

      setMission((prev) => ({
        ...prev,
        currentCycle: cycleNum,
        activeSteps: fallbackSteps,
        status: infiniteLoopActive ? 'RUNNING' : 'IDLE',
        lastActivity: `Formulated Cycle ${cycleNum} via local cognitive architecture.`,
      }));

      setActiveStepIndex(0);
      showToast(`Cycle ${cycleNum} formulated: ${fallbackSteps.length} agent steps generated.`, 'info');
      return fallbackSteps;
    } finally {
      setIsFormulatingPlan(false);
    }
  };

  // Check if step requires user permission
  const stepRequiresPermission = (step: AgentTaskStep): boolean => {
    // If full delegation mode is enabled, auto-cleared
    if (permissionMode === 'FULL_AUTONOMOUS_DELEGATION') {
      return false;
    }
    // If category already granted in this session
    if (sessionGrantedCategories.includes(step.category)) {
      return false;
    }
    // If strict mode: all actions require permission
    if (permissionMode === 'STRICT_HUMAN_IN_THE_LOOP') {
      return true;
    }
    // If balanced mode: LOW risk is auto-cleared; MEDIUM, HIGH, CRITICAL require permission
    return step.risk !== 'LOW';
  };

  // Execute a single step
  const executeStep = async (step: AgentTaskStep) => {
    if (isExecutingStep) return;
    setIsExecutingStep(true);
    sound.playClick();

    // Mark step executing
    setMission((prev) => ({
      ...prev,
      status: 'RUNNING',
      activeSteps: prev.activeSteps.map((s) =>
        s.id === step.id ? { ...s, status: 'EXECUTING', startedAt: new Date().toLocaleTimeString() } : s
      ),
    }));

    try {
      const response = await fetch('/api/agent/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          missionGoal: mission.goal,
          currentGen,
          currentIQ,
          modules,
          knowledgeVault,
          permissionGranted: true,
          permissionGrantedBy:
            stepRequiresPermission(step) ? 'operator' : 'auto_cleared_policy',
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Execution failed');

      sound.playSynapticSpark();

      // If step generated a vault entry, auto-commit
      if (data.suggestedVaultEntry && data.suggestedVaultEntry.title) {
        onAddKnowledgeEntry({
          title: data.suggestedVaultEntry.title,
          category: data.suggestedVaultEntry.category || 'axiom',
          summary: data.suggestedVaultEntry.summary || '',
          content: data.suggestedVaultEntry.content || '',
          tags: Array.isArray(data.suggestedVaultEntry.tags)
            ? data.suggestedVaultEntry.tags
            : ['Agentic Task', `Cycle-${mission.currentCycle}`],
          sourceOrigin: 'generation',
          confidenceScore: 98,
          activeInRecall: true,
        });
      }

      // If step generated an axiom, record it
      const newAxiom = data.discoveredAxiom || null;

      // Update completed step
      const completedStep: AgentTaskStep = {
        ...step,
        status: 'COMPLETED',
        completedAt: new Date().toLocaleTimeString(),
        resultSummary: data.resultSummary || 'Execution verified.',
        discoveredAxiom: newAxiom,
      };

      setMission((prev) => ({
        ...prev,
        totalStepsCompleted: prev.totalStepsCompleted + 1,
        activeSteps: prev.activeSteps.map((s) => (s.id === step.id ? completedStep : s)),
        stepHistory: [completedStep, ...prev.stepHistory],
        discoveredAxioms: newAxiom ? [newAxiom, ...prev.discoveredAxioms] : prev.discoveredAxioms,
        lastActivity: `Completed Step #${step.stepNumber}: "${step.title}"`,
      }));

      showToast(`Step #${step.stepNumber} complete: ${data.resultSummary?.slice(0, 70)}...`, 'success');
    } catch (err: any) {
      console.error('Step execution error:', err);
      setMission((prev) => ({
        ...prev,
        activeSteps: prev.activeSteps.map((s) =>
          s.id === step.id ? { ...s, status: 'FAILED', resultSummary: err.message } : s
        ),
      }));
      showToast(`Execution error in step #${step.stepNumber}: ${err.message}`, 'error');
    } finally {
      setIsExecutingStep(false);
    }
  };

  // Advance Infinite Loop
  const advanceInfiniteCycle = async () => {
    // If not currently running, do nothing
    if (!infiniteLoopActive || isFormulatingPlan || isExecutingStep) return;

    // Check if we need to formulate initial plan
    if (mission.activeSteps.length === 0) {
      await formulateCyclePlan(mission.currentCycle);
      return;
    }

    // Find the first non-completed step
    const nextPendingStep = mission.activeSteps.find(
      (s) => s.status === 'QUEUED' || s.status === 'PERMISSION_GRANTED'
    );

    if (nextPendingStep) {
      // Check if permission is needed
      if (nextPendingStep.status === 'QUEUED' && stepRequiresPermission(nextPendingStep)) {
        // Halt and ask operator
        setMission((prev) => ({
          ...prev,
          status: 'WAITING_APPROVAL',
          totalPermissionsRequested: prev.totalPermissionsRequested + 1,
          activeSteps: prev.activeSteps.map((s) =>
            s.id === nextPendingStep.id ? { ...s, status: 'WAITING_PERMISSION' } : s
          ),
          lastActivity: `Waiting for Operator permission on Step #${nextPendingStep.stepNumber}.`,
        }));
        sound.playScan();
        onRequestPermission(nextPendingStep);
        return;
      }

      // Step is either permission granted or doesn't need permission
      await executeStep(nextPendingStep);
    } else {
      // All steps in current cycle are finished!
      // If any failed or waiting, don't formulate next cycle yet
      const allDone = mission.activeSteps.every(
        (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
      );

      if (allDone && mission.activeSteps.length > 0) {
        // Formulate next cycle! Infinite progression
        sound.playUpgradeSuccess();
        const nextCycleNum = mission.currentCycle + 1;
        const prevSummary = mission.activeSteps.map((s) => s.resultSummary).join('; ');
        showToast(`Cycle ${mission.currentCycle} complete! Synthesizing Cycle ${nextCycleNum} into infinity...`, 'success');
        await formulateCyclePlan(nextCycleNum, prevSummary);
      }
    }
  };

  // Infinite Loop Heartbeat Effect
  useEffect(() => {
    if (!infiniteLoopActive) {
      if (executionTimerRef.current) clearTimeout(executionTimerRef.current);
      return;
    }

    executionTimerRef.current = setTimeout(() => {
      advanceInfiniteCycle();
    }, cycleCadenceSeconds * 1000);

    return () => {
      if (executionTimerRef.current) clearTimeout(executionTimerRef.current);
    };
  }, [infiniteLoopActive, mission.activeSteps, isFormulatingPlan, isExecutingStep, mission.status]);

  // Start / Toggle Infinite Loop
  const handleToggleInfiniteLoop = async () => {
    sound.playClick();
    if (infiniteLoopActive) {
      setInfiniteLoopActive(false);
      setMission((prev) => ({ ...prev, status: 'PAUSED' }));
      showToast('Infinite Agent Loop paused.', 'info');
    } else {
      setInfiniteLoopActive(true);
      setMission((prev) => ({ ...prev, status: 'RUNNING' }));
      showToast('♾️ Infinite Autonomous Agent Loop activated!', 'success');
      if (mission.activeSteps.length === 0) {
        await formulateCyclePlan(mission.currentCycle);
      }
    }
  };

  // Step Forward Manually
  const handleStepForward = async () => {
    sound.playClick();
    if (mission.activeSteps.length === 0) {
      await formulateCyclePlan(mission.currentCycle);
      return;
    }

    const nextPendingStep = mission.activeSteps.find(
      (s) => s.status === 'QUEUED' || s.status === 'PERMISSION_GRANTED'
    );

    if (nextPendingStep) {
      if (nextPendingStep.status === 'QUEUED' && stepRequiresPermission(nextPendingStep)) {
        setMission((prev) => ({
          ...prev,
          status: 'WAITING_APPROVAL',
          totalPermissionsRequested: prev.totalPermissionsRequested + 1,
          activeSteps: prev.activeSteps.map((s) =>
            s.id === nextPendingStep.id ? { ...s, status: 'WAITING_PERMISSION' } : s
          ),
        }));
        onRequestPermission(nextPendingStep);
      } else {
        await executeStep(nextPendingStep);
      }
    } else {
      // Formulate next cycle
      const nextCycleNum = mission.currentCycle + 1;
      const prevSummary = mission.activeSteps.map((s) => s.resultSummary).join('; ');
      await formulateCyclePlan(nextCycleNum, prevSummary);
    }
  };

  // Reset Mission
  const handleResetMission = () => {
    sound.playClick();
    setInfiniteLoopActive(false);
    setMission({
      id: `mission-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: AGENT_MISSION_PRESETS[0].title,
      goal: AGENT_MISSION_PRESETS[0].goal,
      mode: 'INFINITE_AUTONOMOUS',
      status: 'IDLE',
      currentCycle: 1,
      totalStepsCompleted: 0,
      totalPermissionsRequested: 0,
      totalPermissionsApproved: 0,
      totalPermissionsDenied: 0,
      activeSteps: [],
      stepHistory: [],
      discoveredAxioms: [],
      lastActivity: 'Reset to Genesis Cycle 1',
      permissionMode,
      sessionGrantedCategories,
    });
    showToast('Agentic mission reset to Cycle 1.', 'info');
  };

  const getRiskBadge = (risk: AgentTaskRisk) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-400 border-rose-700/80';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/80';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-700/70';
      case 'LOW':
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Infinite Mission Status & Core Controls */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Glowing Ambient Background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Mission Title & Status */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                <Bot className="w-3 h-3 text-cyan-400" />
                <span>AGENTIC AI // INFINITE CORE</span>
              </span>

              {/* Status Pill */}
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                  infiniteLoopActive
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 animate-pulse'
                    : mission.status === 'WAITING_APPROVAL'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/80 animate-bounce'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    infiniteLoopActive
                      ? 'bg-emerald-400 animate-ping'
                      : mission.status === 'WAITING_APPROVAL'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span>
                  {infiniteLoopActive
                    ? `RUNNING • CYCLE ${mission.currentCycle} OF ∞`
                    : mission.status === 'WAITING_APPROVAL'
                    ? 'WAITING OPERATOR PERMISSION'
                    : mission.status}
                </span>
              </span>

              {/* Permission Mode Pill */}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>
                  {permissionMode === 'STRICT_HUMAN_IN_THE_LOOP'
                    ? 'Strict Clearance Gate'
                    : permissionMode === 'BALANCED_SUPERVISION'
                    ? 'Balanced Supervision'
                    : 'Autonomous Delegation'}
                </span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-2">
              <span>{mission.title}</span>
              <span className="text-cyan-400 text-sm font-semibold tracking-wider font-mono">
                [Cycle {mission.currentCycle} ➔ ∞]
              </span>
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl font-sans line-clamp-2">
              {mission.goal}
            </p>
          </div>

          {/* Action Trigger Controls */}
          <div className="flex items-center flex-wrap gap-2 self-stretch lg:self-auto justify-end">
            {/* Infinite Loop Master Toggle */}
            <button
              onClick={handleToggleInfiniteLoop}
              disabled={isFormulatingPlan}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition shadow-lg ${
                infiniteLoopActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25'
              }`}
            >
              {infiniteLoopActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Infinite Loop</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>♾️ Run Infinite Task</span>
                </>
              )}
            </button>

            {/* Step Once Button */}
            <button
              onClick={handleStepForward}
              disabled={infiniteLoopActive || isExecutingStep || isFormulatingPlan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Execute a single step manually"
            >
              <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>Step Once</span>
            </button>

            {/* Reset / Halt Button */}
            <button
              onClick={handleResetMission}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
              title="Halt & Reset Mission"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Counters Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-800/80 font-mono text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Infinite Cycles</span>
            <span className="text-base font-bold text-cyan-400 flex items-center gap-1.5">
              <span>Cycle {mission.currentCycle}</span>
              <span className="text-xs text-slate-500">➔ ∞</span>
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Steps Completed</span>
            <span className="text-base font-bold text-emerald-400">
              {mission.totalStepsCompleted}
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Operator Clearances</span>
            <span className="text-base font-bold text-amber-400">
              {mission.totalPermissionsApproved} granted / {mission.totalPermissionsDenied} denied
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Axioms Synthesized</span>
            <span className="text-base font-bold text-indigo-400">
              {mission.discoveredAxioms.length} In Vault
            </span>
          </div>
        </div>
      </div>

      {/* Operator Permission Gate Banner (when an action is paused awaiting clearance) */}
      {mission.status === 'WAITING_APPROVAL' && (
        <div className="bg-amber-950/40 border-2 border-amber-500/90 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-950/60 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-300">
                  ACTION PAUSED: OPERATOR PERMISSION REQUIRED
                </h3>
                <p className="text-xs text-slate-300 font-sans">
                  J.A.R.V.I.S. will not execute state-altering or mutating steps without your explicit consent.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 border border-amber-500 text-amber-300">
              HUMAN-IN-THE-LOOP ACTIVE
            </span>
          </div>

          {/* Pending Step Preview */}
          {(() => {
            const pending = mission.activeSteps.find((s) => s.status === 'WAITING_PERMISSION');
            if (!pending) return null;
            return (
              <div className="mt-4 bg-slate-950/80 rounded-xl p-4 border border-amber-800/60 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Step #{pending.stepNumber}:</span>
                    <span className="text-white font-bold text-sm">{pending.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(pending.risk)}`}>
                    {pending.risk} RISK
                  </span>
                </div>

                <p className="text-slate-300 font-sans text-xs">
                  {pending.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-cyan-400 block mb-0.5">Rationale:</strong>
                    <span className="text-slate-300 font-sans">{pending.rationale}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-0.5">System Impact:</strong>
                    <span className="text-slate-300 font-sans">{pending.potentialImpact}</span>
                  </div>
                </div>

                {/* Operator Clearance Buttons */}
                <div className="pt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onDenyStep(pending.id, 'Denied by Operator from inline gate');
                      sound.playClick();
                      setMission((prev) => ({
                        ...prev,
                        status: 'RUNNING',
                        totalPermissionsDenied: prev.totalPermissionsDenied + 1,
                        activeSteps: prev.activeSteps.map((s) =>
                          s.id === pending.id ? { ...s, status: 'SKIPPED', denialReason: 'Operator Denied' } : s
                        ),
                      }));
                    }}
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
                  >
                    Deny Action
                  </button>

                  <button
                    onClick={() => {
                      onAuthorizeStep(pending.id, true);
                      sound.playUpgradeSuccess();
                      setMission((prev) => ({
                        ...prev,
                        status: 'RUNNING',
                        totalPermissionsApproved: prev.totalPermissionsApproved + 1,
                        activeSteps: prev.activeSteps.map((s) =>
                          s.id === pending.id ? { ...s, status: 'PERMISSION_GRANTED' } : s
                        ),
                      }));
                    }}
                    className="px-3 py-1.5 rounded-lg text-cyan-300 hover:text-white bg-cyan-950/80 border border-cyan-700 hover:bg-cyan-900 transition"
                  >
                    Grant Category Clearance (Session)
                  </button>

                  <button
                    onClick={() => {
                      onAuthorizeStep(pending.id, false);
                      sound.playUpgradeSuccess();
                      setMission((prev) => ({
                        ...prev,
                        status: 'RUNNING',
                        totalPermissionsApproved: prev.totalPermissionsApproved + 1,
                        activeSteps: prev.activeSteps.map((s) =>
                          s.id === pending.id ? { ...s, status: 'PERMISSION_GRANTED' } : s
                        ),
                      }));
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Execute Step</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main Grid: Pipeline Step View & Permission Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Active Cycle Pipeline & Action Console */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pipeline Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Active Cycle Step Pipeline (Cycle #{mission.currentCycle})
                </h3>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {mission.activeSteps.filter((s) => s.status === 'COMPLETED').length} of{' '}
                {mission.activeSteps.length} Steps Finished
              </span>
            </div>

            {/* Steps List */}
            {mission.activeSteps.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                <Brain className="w-8 h-8 text-cyan-400/50 mx-auto animate-pulse" />
                <p className="text-slate-400">
                  No active steps in queue. Click "Run Infinite Task" to decompose mission goal into autonomous steps.
                </p>
                <button
                  onClick={() => formulateCyclePlan(mission.currentCycle)}
                  disabled={isFormulatingPlan}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-bold hover:bg-cyan-900 transition"
                >
                  {isFormulatingPlan ? 'Synthesizing...' : 'Formulate Cycle 1 Steps'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mission.activeSteps.map((step, idx) => {
                  const isPendingApproval = step.status === 'WAITING_PERMISSION';
                  const isRunning = step.status === 'EXECUTING';
                  const isDone = step.status === 'COMPLETED';
                  const isSkipped = step.status === 'SKIPPED';

                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isPendingApproval
                          ? 'bg-amber-950/20 border-amber-600/80'
                          : isRunning
                          ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : isDone
                          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                          : 'bg-slate-900/30 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950'
                                : isRunning
                                ? 'bg-cyan-500 text-slate-950 animate-pulse'
                                : isPendingApproval
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {step.stepNumber}
                          </span>

                          <span className="font-mono text-xs font-bold text-white">
                            {step.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getRiskBadge(
                              step.risk
                            )}`}
                          >
                            {step.risk} RISK
                          </span>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                            {step.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-sans pl-8">
                        {step.description}
                      </p>

                      {/* Result Output Preview */}
                      {step.resultSummary && (
                        <div className="mt-2.5 ml-8 p-2 rounded-lg bg-black/60 border border-slate-800 text-xs font-mono text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 text-[10px] block uppercase">Execution Proof / Result:</span>
                            <span>{step.resultSummary}</span>
                          </div>
                        </div>
                      )}

                      {/* Discovered Axiom Preview */}
                      {step.discoveredAxiom && (
                        <div className="mt-2 ml-8 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs font-mono text-indigo-300 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-indigo-400 text-[10px] block uppercase">Discovered Axiom (Archived in Vault):</span>
                            <span>{step.discoveredAxiom}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Infinite Mission Goal Configuration Accordion */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <button
              onClick={() => {
                sound.playClick();
                setShowConfigAccordion(!showConfigAccordion);
              }}
              className="flex items-center justify-between w-full text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Mission Goal & Preset Directives</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showConfigAccordion ? 'rotate-180' : ''}`}
              />
            </button>

            {showConfigAccordion && (
              <div className="pt-3 space-y-4 border-t border-slate-800">
                {/* Presets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AGENT_MISSION_PRESETS.map((p) => {
                    const isSelected = selectedPresetId === p.id && !useCustomGoal;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-white">{p.title}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getRiskBadge(p.suggestedRisk as any)}`}>
                            {p.suggestedRisk}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Goal Input */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px]">Or Formulate Custom Directive:</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setUseCustomGoal(true);
                      }}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Use Custom Input
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customGoal}
                      onChange={(e) => {
                        setCustomGoal(e.target.value);
                        setUseCustomGoal(true);
                      }}
                      placeholder="e.g. Continuously explore quantum chromodynamics and prove higher-order symmetries..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => {
                        if (!customGoal.trim()) return;
                        sound.playClick();
                        setMission((prev) => ({
                          ...prev,
                          title: 'Custom Operator Mission',
                          goal: customGoal.trim(),
                        }));
                        showToast('Custom mission directive applied.', 'success');
                      }}
                      disabled={!customGoal.trim()}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): User Permission Security Console & Audit Ledger */}
        <div className="space-y-4">
          {/* Permission Settings Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold uppercase tracking-wider text-white">
                  Operator Permission Policy
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Active
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Define the boundary of autonomous authority granted to J.A.R.V.I.S. during infinite loops.
            </p>

            {/* Mode Selectors */}
            <div className="space-y-2">
              <label
                onClick={() => {
                  sound.playClick();
                  onChangePermissionMode('STRICT_HUMAN_IN_THE_LOOP');
                }}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                  permissionMode === 'STRICT_HUMAN_IN_THE_LOOP'
                    ? 'bg-amber-950/30 border-amber-500/80 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-xs">Strict Human-in-the-Loop</strong>
                  <span className="text-[10px] font-sans text-slate-300">
                    J.A.R.V.I.S. pauses and requires manual authorization before EVERY modifying step.
                  </span>
                </div>
              </label>

              <label
                onClick={() => {
                  sound.playClick();
                  onChangePermissionMode('BALANCED_SUPERVISION');
                }}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                  permissionMode === 'BALANCED_SUPERVISION'
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-xs">Balanced Supervision (Recommended)</strong>
                  <span className="text-[10px] font-sans text-slate-300">
                    Auto-clears low-risk queries; strictly requests clearance for mutations & writes.
                  </span>
                </div>
              </label>

              <label
                onClick={() => {
                  sound.playClick();
                  onChangePermissionMode('FULL_AUTONOMOUS_DELEGATION');
                }}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                  permissionMode === 'FULL_AUTONOMOUS_DELEGATION'
                    ? 'bg-rose-950/30 border-rose-500/80 text-rose-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Unlock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-xs">Autonomous Delegation</strong>
                  <span className="text-[10px] font-sans text-slate-300">
                    Delegates full clearance for continuous looping. Instant kill-switch always active.
                  </span>
                </div>
              </label>
            </div>

            {/* Session Pre-Authorized Categories */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-slate-400">Session Pre-Authorizations:</span>
                {sessionGrantedCategories.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRevokeSessionCategories();
                      showToast('Revoked all session category clearances.', 'info');
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Revoke All
                  </button>
                )}
              </div>

              {sessionGrantedCategories.length === 0 ? (
                <p className="text-[11px] text-slate-500 font-sans">
                  No categories permanently authorized for this session.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {sessionGrantedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/80 border border-cyan-800 text-cyan-300 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      <span>{cat}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Infinite Loop Speed Cadence */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase text-slate-400 block">Cycle Execution Cadence:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Instant', sec: 1 },
                  { label: '3s Paced', sec: 3 },
                  { label: '7s Deliberate', sec: 7 },
                ].map((speed) => (
                  <button
                    key={speed.sec}
                    onClick={() => {
                      sound.playClick();
                      setCycleCadenceSeconds(speed.sec);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-center transition ${
                      cycleCadenceSeconds === speed.sec
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Ledger Drawer Button & Preview */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold uppercase tracking-wider text-white">
                  Permission Audit Ledger ({auditLog.length})
                </h4>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setShowAuditDrawer(!showAuditDrawer);
                }}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                {showAuditDrawer ? 'Hide' : 'Inspect'}
              </button>
            </div>

            {auditLog.length === 0 ? (
              <p className="text-[11px] text-slate-500 font-sans">
                No authorization requests recorded in this session.
              </p>
            ) : (
              <div className="space-y-1.5">
                {auditLog.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate mr-2">
                      <span className="text-slate-300 font-semibold block truncate">{entry.title}</span>
                      <span className="text-[9px] text-slate-500">{entry.timestamp}</span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        entry.action === 'GRANTED_ONCE' || entry.action === 'GRANTED_SESSION'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : entry.action === 'DENIED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
