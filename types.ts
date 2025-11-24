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
  ERROR = 'ERROR'
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
  };
}

export interface AlanSettings {
  personality: 'jarvis' | 'tars' | 'hybrid';
  humorLevel: number;
  voiceEnabled: boolean;
  wakeWordEnabled: boolean;
  cameraEnabled: boolean;
  offlineMode: boolean;
}

export interface SystemState {
  listening: boolean;
  speaking: boolean;
  processing: boolean;
  layerStatuses: Record<string, LayerStatus>;
  lastIntent: string | null;
  visualContext: string | null; // Added for continuous vision
}

export type ToolFunction = (args: any) => Promise<string>;

export interface ExecutionTool {
  name: string;
  description: string;
  execute: ToolFunction;
}