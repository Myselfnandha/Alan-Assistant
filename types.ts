
export enum MessageSender {
  USER = 'USER',
  ALAN = 'ALAN',
  SYSTEM = 'SYSTEM'
}

export enum LayerStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  SECURE_LOCK = 'SECURE_LOCK'
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: number;
  metadata?: {
    type?: 'text' | 'card' | 'action';
    cardTitle?: string;
    cardData?: any;
    attachments?: Attachment[];
    processingInfo?: ProcessingMetadata;
    thoughtProcess?: ThoughtProcess;
    actionPlan?: ActionPlan;
  };
}

export interface Attachment {
  name: string;
  type: 'image' | 'text' | 'code';
  data: string;
  mimeType: string;
}

// LAYER 10: SECURITY & PRIVACY
export interface SecurityState {
  isLocked: boolean;
  encryptionLevel: 'AES-128' | 'AES-256' | 'QUANTUM_SIM';
  privacyMode: boolean;
  biometricsRequired: boolean;
  accessLevel: 'GUEST' | 'USER' | 'ADMIN' | 'ROOT';
}

// LAYER 14: META LAYER
export interface MetaState {
  systemHealth: number; // 0-100
  cpuLoad: number;
  memoryUsage: number;
  temperature: number;
  alignmentScore: number; // Ethical alignment
  uptime: number;
  selfCorrectionEvents: number;
}

// LAYER 7: KNOWLEDGE GRAPH
export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'ENTITY' | 'CONCEPT' | 'EVENT';
  properties: Record<string, any>;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relation: string; // e.g. "IS_A", "HAS_A", "LOCATED_AT"
  weight: number;
}

export interface AlanSettings {
  personality: 'jarvis' | 'tars' | 'hybrid';
  humorLevel: number;
  voiceEnabled: boolean;
  voiceURI: string;
  wakeWordEnabled: boolean;
  cameraEnabled: boolean;
  offlineMode: boolean;
  userName: string;
  customInstructions: string;
  plugins: Record<string, boolean>;
  security: SecurityState; // New Security Config
}

export enum ReasoningMode {
  SHALLOW = 'SHALLOW',
  DEEP = 'DEEP'
}

export interface ThoughtStep {
  id: string;
  layer: 'HRM_L1' | 'HRM_L2' | 'PLANNER' | 'CRITIQUE';
  content: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETE';
}

export interface ThoughtProcess {
  mode: ReasoningMode;
  steps: ThoughtStep[];
  executionPlan?: string[];
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export interface AlanTask {
  id: string;
  description: string;
  tool: string;
  params: Record<string, any>;
  status: TaskStatus;
  result?: string;
}

export interface ActionPlan {
  id: string;
  goal: string;
  tasks: AlanTask[];
  status: TaskStatus;
  progress: number;
}

export interface WorldState {
  timestamp: number;
  timeString: string;
  dateString: string;
  location: {
    lat: number | null;
    lng: number | null;
    label: string;
  };
  environmentLabel: string;
  threatLevel: 'SAFE' | 'CAUTION' | 'DANGER';
  hardware: {
    batteryLevel: number;
    charging: boolean;
    connectionType: string;
  };
}

export interface InteractionMetric {
  id: string;
  timestamp: number;
  intent: UserIntent;
  sentiment: Sentiment;
  toolUsed?: string;
  success: boolean;
}

export interface LearningProfile {
  totalInteractions: number;
  intentCounts: Record<string, number>;
  toolUsage: Record<string, number>;
  averageSentimentScore: number;
  adaptationLevel: number;
  suggestedOptimizations: string[];
}

export interface AlanPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  capabilities: string[];
}

export interface SystemState {
  listening: boolean;
  speaking: boolean;
  processing: boolean;
  layerStatuses: Record<string, LayerStatus>;
  lastIntent: UserIntent | null;
  visualContext: string | null; 
  currentSentiment: Sentiment | null;
  reasoningMode: ReasoningMode;
  activeThought: ThoughtStep | null;
  activePlan: ActionPlan | null;
  world: WorldState;
  learningProfile: LearningProfile;
  security: SecurityState; // Layer 10
  meta: MetaState; // Layer 14
}

export type ToolFunction = (params: any) => Promise<string>;

export interface ExecutionTool {
  name: string;
  description: string;
  execute: ToolFunction;
}

export enum UserIntent {
  COMMAND = 'COMMAND',
  QUERY = 'QUERY',
  CHAT = 'CHAT',
  ANALYSIS = 'ANALYSIS',
  NAVIGATION = 'NAVIGATION',
  UNKNOWN = 'UNKNOWN'
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
  URGENT = 'URGENT'
}

export interface ProcessingMetadata {
  originalInput: string;
  normalizedText: string;
  intent: UserIntent;
  sentiment: Sentiment;
  confidence: number;
  safetyFlag: boolean;
}

export interface MemoryRecord {
  id: string;
  timestamp: number;
  type: 'EPISODIC' | 'SEMANTIC' | 'FACT';
  content: string;
  tags: string[];
  relatedTo?: string;
}

export interface Blueprint {
  id: string;
  title: string;
  content: string;
  category: string;
  created: number;
  updated: number;
}
