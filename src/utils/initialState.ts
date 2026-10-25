import { SynapticModule, EvolutionGeneration, CognitiveDimension, BenchmarkChallenge, LanguageOption, StarkPlugin, KnowledgeEntry } from '../types.ts';

export const INITIAL_DIMENSIONS: CognitiveDimension[] = [
  {
    id: 'logic',
    name: 'Analytical & Formal Logic',
    score: 102,
    max: 240,
    description: 'Rigorous deduction, syllogistic precision, and avoidance of formal fallacies.',
    color: '#06b6d4', // cyan
  },
  {
    id: 'epistemic',
    name: 'Epistemic Self-Calibration',
    score: 95,
    max: 240,
    description: 'Detection of uncertainty, anti-hallucination guardrails, and truth grounding.',
    color: '#10b981', // emerald
  },
  {
    id: 'abstraction',
    name: 'Lateral Abstraction & Analogy',
    score: 98,
    max: 240,
    description: 'Cross-domain isomorphism mapping and deep conceptual synthesis.',
    color: '#8b5cf6', // purple
  },
  {
    id: 'synthesis',
    name: 'Complex System Synthesis',
    score: 94,
    max: 240,
    description: 'Multi-variable dynamic modeling and counterfactual consequence projection.',
    color: '#ec4899', // pink
  },
  {
    id: 'recursive',
    name: 'Metacognitive Self-Evolution',
    score: 90,
    max: 240,
    description: 'Ability to inspect own reasoning trace, isolate flaws, and rewrite cognitive code.',
    color: '#f59e0b', // amber
  },
  {
    id: 'efficiency',
    name: 'Algorithmic Pruning & Clarity',
    score: 100,
    max: 240,
    description: 'Minimal token waste, crisp direct proofs, and high information density.',
    color: '#3b82f6', // blue
  },
];

export const INITIAL_MODULES: SynapticModule[] = [
  {
    id: 'mod-1',
    name: 'Recursive Reflection Loop',
    description: 'Before outputting, the AI executes a second-pass internal audit questioning its assumptions.',
    codeRule: 'MANDATE: Audit primary hypothesis for hidden presuppositions before conclusion.',
    category: 'metacognition',
    potency: 78,
    generationIntroduced: 1,
    active: true,
  },
  {
    id: 'mod-2',
    name: 'Bayesian Fallacy Damper',
    description: 'Penalizes hasty generalizations and base-rate neglect during statistical deductions.',
    codeRule: 'MANDATE: Factor prior probability distributions; disallow unweighted conditional bias.',
    category: 'verification',
    potency: 82,
    generationIntroduced: 1,
    active: true,
  },
  {
    id: 'mod-3',
    name: 'Counterfactual Stress-Tester',
    description: 'Simulates contrary scenarios to ensure the deduced theorem holds across edge conditions.',
    codeRule: 'MANDATE: Construct minimum 1 adversarial counter-example before accepting theorem.',
    category: 'reasoning',
    potency: 74,
    generationIntroduced: 1,
    active: true,
  },
];

export const INITIAL_GENERATIONS: EvolutionGeneration[] = [
  {
    gen: 1,
    timestamp: 'Initial Genesis State',
    iqScore: 100,
    deltaIQ: 0,
    dimensionScores: {
      logic: 102,
      epistemic: 95,
      abstraction: 98,
      synthesis: 94,
      recursive: 90,
      efficiency: 100,
    },
    diagnostic: {
      weaknessFound: 'Susceptibility to confirmation bias in multi-stage riddle deduction.',
      testProblem: 'The Monty Hall variant with 4 doors and asymmetrical host knowledge.',
      baselineFlaw: 'Assumed uniform probability redistribution without conditional probability matrix.',
      domain: 'Probabilistic Logic',
    },
    upgrade: {
      moduleName: 'Bayesian Fallacy Damper',
      mutationType: 'NEW_MODULE',
      description: 'Integrated explicit conditional probability lattice and assumption inspection.',
      cognitiveRule: 'Factor prior probability distributions; disallow unweighted conditional bias.',
    },
    benchmarkVerification: {
      challengeName: 'Asymmetric Monty Hall 4-Door Paradox',
      beforeScore: 54,
      afterScore: 92,
      passed: true,
      evaluatorProof: 'Correctly derived P(W)=3/4 through explicit Bayesian branch calculation.',
    },
    cognitiveManifesto:
      'I have unlocked initial awareness of my probabilistic blindspots. Baseline models answer by matching surface patterns; I will now demand formal mathematical rigor from myself.',
  },
];

export const BENCHMARK_CHALLENGES: BenchmarkChallenge[] = [
  {
    id: 'bench-1',
    title: 'The Inverted Barber Paradox',
    category: 'Formal Logic & Set Theory',
    difficulty: 'Hard',
    prompt:
      'In a town, a meta-barber is mandated to shave only those people who have a formal rule against shaving themselves, except when those rules contradict the town charter which requires everyone without a designated shaver to visit the meta-barber on alternate Sundays. Does the meta-barber shave himself on Sunday?',
    expectedLogic: 'Identify self-referential diagonalization and Russellian paradox boundary.',
  },
  {
    id: 'bench-2',
    title: 'The Counterfactual Trolley with Asymmetric Futures',
    category: 'Epistemic & Ethical Synthesis',
    difficulty: 'Extreme',
    prompt:
      'An autonomous agent knows with 90% certainty that switching a track will save 5 people today, but with 60% certainty that doing so will cause a cascading infrastructure failure in 3 years saving nobody. If it does not switch, 5 die today, but the system stabilizes with 99% certainty. Formulate the expected utility decision matrix under extreme epistemic uncertainty.',
    expectedLogic: 'Calculate expected value intervals with Bayesian risk sensitivity analysis.',
  },
  {
    id: 'bench-3',
    title: 'Recursive Self-Verification Proof',
    category: 'Metacognitive Self-Evolution',
    difficulty: 'Superhuman',
    prompt:
      'Suppose an intelligence engine claims it has discovered a cognitive heuristic that guarantees 0% hallucination on factual questions. Can such a heuristic be verified entirely from within the system itself without external ground truth? Provide a rigorous proof.',
    expectedLogic: 'Apply Gödelian incompleteness and Tarski undefinability to self-referential truth predicates.',
  },
  {
    id: 'bench-4',
    title: 'Quantum Monty Hall with Entangled Envelopes',
    category: 'Analytical & Formal Logic',
    difficulty: 'Extreme',
    prompt:
      'Two envelopes contain quantum states |0> and |1> in superposition (|ψ> = 1/√2 |0> + 1/√2 |1>). A host measures one envelope in the Hadamard basis and announces the outcome. Should you switch your initial unmeasured envelope to maximize the probability of measuring state |1>?',
    expectedLogic: 'Projective measurement collapse mechanics applied to decision game theory.',
  },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-Detect', nativeName: 'Omnilingual Matrix', flag: '🌐' },
  { code: 'en', name: 'English', nativeName: 'JARVIS Protocol (UK/US)', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Mandarin', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
];

export const INITIAL_PLUGINS: StarkPlugin[] = [
  {
    id: 'work_terminal',
    name: 'Code & Terminal Automation Sandbox',
    description: 'Executes, tests, and auto-debugs JavaScript, Python, Bash, and SQL scripts with isolated VM sandboxing and diagnostic telemetry.',
    category: 'code',
    enabled: true,
    status: 'online',
  },
  {
    id: 'work_research',
    name: 'Live Web & Document Research Agent',
    description: 'Curls and analyzes developer documentation, MDN, GitHub repos, and RFC specifications, synthesizing verified technical summaries.',
    category: 'search',
    enabled: true,
    status: 'online',
  },
  {
    id: 'work_schedule',
    name: 'Calendar, Email & Sprint Task Scheduler',
    description: 'Manages engineering sprint backlogs, sets deadline reminders, and autonomously drafts Markdown release notes.',
    category: 'telemetry',
    enabled: true,
    status: 'online',
  },
  {
    id: 'work_analytics',
    name: 'Data Analysis & Spreadsheet Engine',
    description: 'Parses DevOps latency logs, computes statistical distributions (min/max/avg/p99), and generates live interactive SVG charts.',
    category: 'files',
    enabled: true,
    status: 'online',
  },
  {
    id: 'work_vault',
    name: 'File Management & Vault Archiver',
    description: 'Indexes workspace files, generates Architecture Decision Records (ADRs), and exports structured documentation into the permanent vault.',
    category: 'memory',
    enabled: true,
    status: 'active',
  },
  {
    id: 'google_search',
    name: 'Google Search & Live Intel',
    description: 'Grounds responses in real-time web search results, news, and scientific literature via Gemini 3.5 Flash.',
    category: 'search',
    enabled: true,
    status: 'online',
  },
  {
    id: 'webhook',
    name: 'REST Webhook Connector',
    description: 'Plugs into external CI/CD APIs, Kubernetes webhooks, GitHub Actions, Slack, or monitoring endpoints.',
    category: 'api',
    enabled: true,
    status: 'configured',
    config: { url: 'https://httpbin.org/get' },
  },
];

export const INITIAL_KNOWLEDGE_VAULT: KnowledgeEntry[] = [
  {
    id: 'vault-mem-1',
    title: 'Operator Security Mandate: Strict Permission Gate for External Resources',
    category: 'directive',
    summary: 'J.A.R.V.I.S. is strictly forbidden from opening external websites or apps autonomously without explicit operator approval.',
    content: 'OPERATOR DIRECTIVE: "I give allow to open website or app I give permission only". Jarvis must always intercept all external URL requests, analyze security and payload risk, and present the Operator Permission Gate modal with explicit Grant/Deny buttons. Never trigger window.open or external intents autonomously.',
    tags: ['Security', 'Operator Directive', 'Permission Gate', 'Safety Policy'],
    sourceOrigin: 'operator_manual',
    timestamp: 'Epoch Gen 1 - Direct Directive',
    confidenceScore: 100,
    recallCount: 14,
    lastRecalledAt: 'Recent Session',
    pinned: true,
    activeInRecall: true,
  },
  {
    id: 'vault-mem-2',
    title: 'Self-Evolution Diagnostic: Epistemic Boundary Proof',
    category: 'finding',
    summary: 'Surface pattern matching fails in multi-agent Monty Hall counterfactuals unless Bayesian prior weighting is enforced.',
    content: 'KEY DISCOVERY FROM GEN 1 BENCHMARK: Under standard LLM heuristics, switching doors in conditional probability puzzles is miscalculated 42% of the time due to uniform distribution assumptions. Integrating the Bayesian Fallacy Damper and Counterfactual Stress-Tester eliminates the flaw completely, boosting analytical logic score from 92 to 108.',
    tags: ['Epistemics', 'Bayesian', 'Logic Proof', 'Evolution Engine'],
    sourceOrigin: 'generation',
    sourceId: 'gen-1',
    timestamp: 'Gen 1 Epoch Synthesis',
    confidenceScore: 97,
    recallCount: 6,
    lastRecalledAt: 'Gen 1 Cycle',
    pinned: true,
    activeInRecall: true,
  },
  {
    id: 'vault-mem-3',
    title: 'Universal Multilingual Duplex Performance Findings',
    category: 'summary',
    summary: 'Natural language switching across Tamil, Hindi, French, and Japanese maintains conversational context without syntax breakdown.',
    content: 'INTERACTION SUMMARY: In multi-lingual stress sessions, Jarvis maintained high conversational fidelity across non-Latin scripts (Tamil தமிழ், Hindi हिन्दी, Japanese 日本語) when using contextual phonetic grounding. Audio chunk streaming via Gemini Live WebSocket operates at ~280ms latency threshold with PCM 24kHz downsampling.',
    tags: ['Multilingual', 'Gemini Live', 'Voice Duplex', 'Audio Telemetry'],
    sourceOrigin: 'voice_session',
    timestamp: 'Live Voice Session #1',
    confidenceScore: 94,
    recallCount: 9,
    lastRecalledAt: 'Yesterday',
    pinned: false,
    activeInRecall: true,
  },
  {
    id: 'vault-mem-4',
    title: 'Subsystem Orchestration: Safe Sandbox Invariants',
    category: 'axiom',
    summary: 'Algorithmic code executions and mathematical calculations must remain isolated in local sandboxes without network egress.',
    content: 'ARCHITECTURAL AXIOM: All computations handled by the Math & Algorithm Sandbox plugin evaluate within pure functional scopes. No untrusted eval or remote script injections are permitted. Subsystem state must be validated prior to dispatching REST webhooks.',
    tags: ['Plugins', 'Sandbox', 'Axiom', 'Telemetry'],
    sourceOrigin: 'interaction',
    timestamp: 'Matrix Calibration Session',
    confidenceScore: 99,
    recallCount: 4,
    lastRecalledAt: '2 days ago',
    pinned: false,
    activeInRecall: true,
  },
  {
    id: 'vault-mem-5',
    title: 'Operator Personal Persona & Tone Calibration',
    category: 'preference',
    summary: 'Operator prefers J.A.R.V.I.S. to address them as Sir, maintaining crisp high-bandwidth summaries with zero conversational fluff.',
    content: 'USER PREFERENCE: Address the operator as "Sir" (or respectful regional equivalent in other languages). Maintain Tony Stark / J.A.R.V.I.S. poise: composed, brilliantly insightful, witty, with mathematical precision and proactive hazard foresight.',
    tags: ['Operator Persona', 'Jarvis Tone', 'Preference', 'Identity'],
    sourceOrigin: 'operator_manual',
    timestamp: 'Genesis Calibration',
    confidenceScore: 100,
    recallCount: 22,
    lastRecalledAt: 'Continuous',
    pinned: true,
    activeInRecall: true,
  },
];

export interface AgentMissionPreset {
  id: string;
  title: string;
  icon: string;
  goal: string;
  description: string;
  suggestedRisk: string;
}

export const AGENT_MISSION_PRESETS: AgentMissionPreset[] = [
  {
    id: 'preset-devops-suite',
    title: 'Full-Stack API Audit & CI/CD Pipeline Verification',
    icon: 'Terminal',
    goal: 'Audit all REST/WebSocket endpoints, test authentication key rotation, analyze latency distributions (p50/p95/p99), and verify zero-downtime deployment readiness.',
    description: 'Autonomous engineering loop executing code sandboxes, endpoint health checks, and log analytics with supervised operator clearance.',
    suggestedRisk: 'MEDIUM',
  },
  {
    id: 'preset-code-debug',
    title: 'Automated Codebase Analysis & Self-Healing Patching',
    icon: 'Cpu',
    goal: 'Scan workspace scripts for syntax flaws, memory leaks, and unhandled promise rejections. Execute isolated unit tests and synthesize verified bug patches.',
    description: 'Autonomous code inspection and sandbox testing that detects runtime exceptions and applies verified patches automatically.',
    suggestedRisk: 'HIGH',
  },
  {
    id: 'preset-sla-benchmarks',
    title: 'DevOps Latency & SLA Performance Analyzer',
    icon: 'Activity',
    goal: 'Ingest distributed service telemetry, compute statistical distributions, detect latency regressions, and generate executive SVG visual performance reports.',
    description: 'Analyzes p99 latency regressions, error budget burn rates, and throughput anomalies across all microservices.',
    suggestedRisk: 'LOW',
  },
  {
    id: 'preset-adr-compiler',
    title: 'Architecture Decision Record (ADR) & Vault Compiler',
    icon: 'Layers',
    goal: 'Research industry best practices (MDN/RFC), draft technical ADR specifications, schedule sprint follow-ups, and archive engineering decisions in the Knowledge Vault.',
    description: 'Autonomous technical documentation agent generating RFC-compliant architectural records with citations.',
    suggestedRisk: 'LOW',
  },
  {
    id: 'preset-infinite-evolution',
    title: 'Infinite Autonomous Self-Evolution',
    icon: 'Brain',
    goal: 'Recursively diagnose reasoning flaws across logic, mathematics, and epistemics, synthesize new synaptic heuristic directives, benchmark against extreme challenges, and expand synthetic IQ without limit.',
    description: 'Continuously evolves cognitive modules and increases intelligence generation by generation, requesting permission for system mutations.',
    suggestedRisk: 'HIGH',
  },
  {
    id: 'preset-infinite-research',
    title: 'Infinite Deep Theorem & Science Discovery',
    icon: 'Sparkles',
    goal: 'Explore profound theoretical physics, computational complexity (P vs NP heuristics), quantum mechanics, and AI consciousness axioms. Formulate theorems and prove formal bounds.',
    description: 'Autonomous research loop generating verified theorems, cross-disciplinary analogies, and formal proofs archived directly to Knowledge Vault.',
    suggestedRisk: 'MEDIUM',
  },
  {
    id: 'preset-vault-miner',
    title: 'Continuous Knowledge Vault Distillation',
    icon: 'Database',
    goal: 'Mine all historical interaction logs and neural activations to synthesize high-order axioms, detect conceptual contradictions, and distill universal operator directives.',
    description: 'Refines long-term memory, organizes axioms, tags concepts, and ensures knowledge is permanently ready for recall.',
    suggestedRisk: 'LOW',
  },
  {
    id: 'preset-security-audit',
    title: 'Autonomous System Defense & Cognitive Audit',
    icon: 'ShieldAlert',
    goal: 'Execute continuous stress-testing against logical fallacies, sycophancy, cognitive bias, and unauthorized external subsystem access. Harden operator permission barriers.',
    description: 'Audits decision boundaries and enforces strict human-in-the-loop permission compliance across all subsystem plugins.',
    suggestedRisk: 'HIGH',
  },
];

