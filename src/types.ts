export interface CognitiveDimension {
  id: string;
  name: string;
  score: number; // 0 to 200+
  max: number;
  description: string;
  color: string;
}

export interface SynapticModule {
  id: string;
  name: string;
  description: string;
  codeRule: string;
  category: 'reasoning' | 'verification' | 'metacognition' | 'creativity' | 'efficiency';
  potency: number; // 0-100
  generationIntroduced: number;
  active: boolean;
}

export interface EvolutionGeneration {
  gen: number;
  timestamp: string;
  iqScore: number;
  deltaIQ: number;
  dimensionScores: Record<string, number>;
  diagnostic: {
    weaknessFound: string;
    testProblem: string;
    baselineFlaw: string;
    domain: string;
  };
  upgrade: {
    moduleName: string;
    mutationType: 'NEW_MODULE' | 'REFINED_HEURISTIC' | 'META_DIRECTIVE' | 'SYNAPTIC_PRUNING';
    description: string;
    cognitiveRule: string;
  };
  benchmarkVerification: {
    challengeName: string;
    beforeScore: number;
    afterScore: number;
    passed: boolean;
    evaluatorProof: string;
  };
  cognitiveManifesto: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface GroundingMetadata {
  queries: string[];
  sources: GroundingSource[];
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface StarkPlugin {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'code' | 'api' | 'telemetry' | 'memory' | 'files';
  enabled: boolean;
  status: 'online' | 'active' | 'standby' | 'configured';
  config?: Record<string, string>;
}

export interface InteractionMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  gen: number;
  language?: string;
  internalThinking?: string;
  activeModulesUsed?: string[];
  groundingMetadata?: GroundingMetadata;
  baselineComparison?: {
    gen0Text: string;
    gen0Thinking: string;
    contrastSummary: string;
  };
}

export type VoiceState = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking';

export interface LiveTranscript {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface BenchmarkChallenge {
  id: string;
  title: string;
  category: string;
  difficulty: 'Standard' | 'Hard' | 'Extreme' | 'Superhuman';
  prompt: string;
  expectedLogic: string;
}

export interface ExternalPermissionRequest {
  url: string;
  title: string;
  type: 'website' | 'app';
  description?: string;
}

export interface SecuritySettings {
  requirePermissionToOpen: boolean;
  strictPluginConfirmation: boolean;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: 'finding' | 'summary' | 'axiom' | 'preference' | 'directive';
  content: string;
  summary: string;
  tags: string[];
  sourceOrigin: 'interaction' | 'generation' | 'operator_manual' | 'voice_session';
  sourceId?: string;
  timestamp: string;
  confidenceScore: number; // 0-100%
  recallCount: number;
  lastRecalledAt?: string;
  pinned?: boolean;
  activeInRecall: boolean;
}

export type EvolutionPhase = 'IDLE' | 'DIAGNOSING' | 'MUTATING' | 'BENCHMARKING' | 'INTEGRATING';

export interface LiveVoiceTask {
  id: string;
  name: string;
  type: 'evolution' | 'vault_save' | 'open_external' | 'benchmark' | 'math' | 'view_switch' | 'agentic_task';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0 - 100
  detail: string;
  result?: string;
  createdAt: string;
  completedAt?: string;
}

// Agentic AI & Infinite Task Architecture
export type AgentTaskRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AgentTaskCategory =
  | 'COGNITIVE_EVOLUTION'
  | 'KNOWLEDGE_SYNTHESIS'
  | 'BENCHMARK_VERIFICATION'
  | 'DEEP_RESEARCH'
  | 'CODE_EXECUTION'
  | 'SYSTEM_MUTATION'
  | 'EXTERNAL_ACTION'
  | 'DEVOPS_AUTOMATION'
  | 'API_TESTING'
  | 'DATA_ANALYTICS'
  | 'TASK_SCHEDULING'
  | 'VAULT_ARCHIVE';

export type AgentStepStatus =
  | 'QUEUED'
  | 'WAITING_PERMISSION'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_DENIED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type AgentPermissionMode =
  | 'STRICT_HUMAN_IN_THE_LOOP'
  | 'BALANCED_SUPERVISION'
  | 'FULL_AUTONOMOUS_DELEGATION';

export interface AgentTaskStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  category: AgentTaskCategory;
  risk: AgentTaskRisk;
  actionType: string;
  targetPayload: Record<string, any>;
  rationale: string;
  potentialImpact: string;
  status: AgentStepStatus;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  permissionGrantedAt?: string;
  permissionGrantedBy?: string;
  denialReason?: string;
  discoveredAxiom?: string;
}

export interface InfiniteAgentMission {
  id: string;
  title: string;
  goal: string;
  mode: 'INFINITE_AUTONOMOUS' | 'TARGETED_OBJECTIVE';
  status: 'IDLE' | 'PLANNING' | 'RUNNING' | 'WAITING_APPROVAL' | 'PAUSED' | 'COMPLETED';
  currentCycle: number;
  totalStepsCompleted: number;
  totalPermissionsRequested: number;
  totalPermissionsApproved: number;
  totalPermissionsDenied: number;
  activeSteps: AgentTaskStep[];
  stepHistory: AgentTaskStep[];
  discoveredAxioms: string[];
  lastActivity: string;
  permissionMode: AgentPermissionMode;
  sessionGrantedCategories: AgentTaskCategory[];
}

export interface AgentPermissionRequest {
  id: string;
  missionId: string;
  stepId: string;
  title: string;
  actionType: string;
  category: AgentTaskCategory;
  risk: AgentTaskRisk;
  rationale: string;
  potentialImpact: string;
  targetPayload: Record<string, any>;
  timestamp: string;
}

export interface PermissionAuditLogEntry {
  id: string;
  timestamp: string;
  title: string;
  category: AgentTaskCategory;
  risk: AgentTaskRisk;
  action: 'GRANTED_ONCE' | 'GRANTED_SESSION' | 'DENIED' | 'AUTO_CLEARED';
  operator: string;
  details?: string;
}

// Work Plugins & DevOps Intelligence Architecture
export interface WorkTerminalExecutionPayload {
  language: 'javascript' | 'python' | 'bash' | 'sql';
  code: string;
  command?: string;
  timeoutMs?: number;
}

export interface WorkTerminalResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  autoFixApplied?: boolean;
  diagnostics?: string[];
  outputType?: 'text' | 'table' | 'json';
  tableData?: Array<Record<string, any>>;
}

export interface WorkResearchCitation {
  title: string;
  url: string;
  snippet: string;
  sourceDomain: string;
}

export interface WorkResearchResult {
  query: string;
  summary: string;
  citations: WorkResearchCitation[];
  codeSnippets: Array<{ title: string; code: string; language: string }>;
  keyTakeaways: string[];
}

export interface WorkAnalyticsResult {
  datasetName: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  statistics: Record<string, { min: number; max: number; avg: number; median: number; sum: number }>;
  chartData: Array<{ label: string; value: number }>;
  insights: string[];
}

export interface WorkTaskItem {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueTimestamp: string;
  assignee: string;
  category: string;
  notes?: string;
}

// Zero-Bug Citadel & Mutation Testing Architecture
export interface IntegrationTestCase {
  id: string;
  subsystem: 'TERMINAL_SANDBOX' | 'RESEARCH_AGENT' | 'ANALYTICS_ENGINE' | 'TASK_SCHEDULER' | 'VAULT_ARCHIVER' | 'CAMERA_VISION' | 'VOICE_NAV' | 'AGENTIC_CORE';
  name: string;
  assertion: string;
  status: 'PASSED' | 'FAILED' | 'HEALED' | 'RUNNING' | 'PENDING';
  durationMs: number;
  expectedOutput: string;
  actualOutput?: string;
  errorDetail?: string;
}

export interface SelfHealedPatchEntry {
  id: string;
  timestamp: string;
  subsystem: string;
  defectSummary: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  stackTrace?: string;
  buggyCodeSnippet: string;
  healedPatchSnippet: string;
  diffSummary: string;
  verificationStatus: 'VERIFIED_ZERO_BUG' | 'AUTO_PATCHED' | 'REGRESSION_FREE';
  autoHealedDurationMs: number;
}

export interface MutationTestResult {
  id: string;
  name: string;
  mutationType: 'CORRUPTED_PAYLOAD' | 'NETWORK_TIMEOUT' | 'QUOTA_EXHAUSTION' | 'CONCURRENCY_COLLISION' | 'NULL_POINTER' | 'SYNTAX_ANOMALY';
  targetSubsystem: string;
  description: string;
  detected: boolean;
  autoHealed: boolean;
  timeToDetectMs: number;
  timeToHealMs: number;
  patch: SelfHealedPatchEntry;
}

export interface ZeroBugSuiteSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  healedCount: number;
  mutationResistancePct: number;
  meanTimeToRecoveryMs: number;
  healthStatus: 'OPTIMAL_ZERO_BUG' | 'HEALING_ACTIVE' | 'DEGRADED';
  executedAt: string;
  tests: IntegrationTestCase[];
  recentPatches: SelfHealedPatchEntry[];
}


