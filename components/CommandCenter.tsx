
import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Shield, Database, Terminal, Settings, FileText, 
  Mic, Camera, X, Save, Upload, User, LayoutGrid, Brain, FileCode,
  Globe, Clock, MapPin, AlertTriangle, List, CheckCircle, Circle, PlayCircle, Speaker, Zap,
  CloudRain, Music, MessageSquare, Box, Lock, Network, Thermometer, Battery
} from 'lucide-react';
import { AlanSettings, SystemState, UserIntent, Sentiment, Blueprint, TaskStatus } from '../types';
import { Button, StatCard, ProgressBar, RangeSlider, TerminalText, CornerBrackets, Card } from './HolographicComponents';
import { memoryService } from '../services/memoryService';
import { getVoices } from '../services/speechService';
import { learningService } from '../services/learningService';
import { AVAILABLE_PLUGINS } from '../services/pluginService';
import { environmentService } from '../services/environmentService';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlanSettings;
  onUpdateSettings: (s: AlanSettings) => void;
  systemState: SystemState;
  logs: string[];
}

const CommandCenter: React.FC<CommandCenterProps> = ({ 
  isOpen, onClose, settings, onUpdateSettings, systemState, logs 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'inputs' | 'memory' | 'logs' | 'tasks' | 'plugins' | 'security' | 'meta' | 'graph'>('overview');
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [envInfo, setEnvInfo] = useState("SCANNING...");

  useEffect(() => {
      if (isOpen && activeTab === 'memory') {
          memoryService.getAllBlueprints().then(setBlueprints);
      }
      if (isOpen && activeTab === 'config') {
          setAvailableVoices(getVoices());
      }
      if (isOpen && activeTab === 'overview') {
          setEnvInfo(environmentService.detectEnvironment());
      }
  }, [isOpen, activeTab]);
  
  if (!isOpen) return null;

  const getSentimentColor = (s: Sentiment | null) => {
    switch (s) {
      case Sentiment.POSITIVE: return 'text-alan-success';
      case Sentiment.NEGATIVE: return 'text-alan-accent';
      case Sentiment.URGENT: return 'text-alan-warning animate-pulse';
      default: return 'text-alan-secondary';
    }
  };

  const getThreatColor = (l: string) => {
      if (l === 'DANGER') return 'text-alan-accent animate-pulse';
      if (l === 'CAUTION') return 'text-alan-warning';
      return 'text-alan-success';
  };

  const togglePlugin = (id: string) => {
      onUpdateSettings({
          ...settings,
          plugins: {
              ...settings.plugins,
              [id]: !settings.plugins[id]
          }
      });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col md:flex-row animate-appear text-alan-secondary font-display">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="scanlines" />

      {/* Sidebar Nav */}
      <div className="w-full md:w-24 md:border-r border-b md:border-b-0 border-alan-primary/20 bg-alan-primary/5 flex md:flex-col items-center justify-center md:justify-start gap-2 p-2 relative z-10">
         <div className="hidden md:block mb-8 mt-4">
             <LayoutGrid size={32} className="text-alan-primary animate-pulse-slow" />
         </div>
         
         {[
           { id: 'overview', icon: Activity, label: 'STATUS' },
           { id: 'meta', icon: Activity, label: 'META' },
           { id: 'tasks', icon: List, label: 'TASKS' }, 
           { id: 'security', icon: Shield, label: 'SECURE' },
           { id: 'inputs', icon: FileText, label: 'INPUTS' },
           { id: 'plugins', icon: Box, label: 'PLUGINS' },
           { id: 'memory', icon: Database, label: 'DB_CORE' },
           { id: 'graph', icon: Network, label: 'K_GRAPH' },
           { id: 'config', icon: Settings, label: 'CONFIG' },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all w-20 md:w-full ${activeTab === tab.id ? 'bg-alan-primary/20 text-alan-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'hover:bg-alan-primary/10 opacity-60 hover:opacity-100'}`}
           >
             <tab.icon size={20} />
             <span className="text-[9px] font-mono tracking-widest">{tab.label}</span>
           </button>
         ))}

         <button onClick={onClose} className="md:mt-auto p-3 text-alan-accent hover:text-red-400 opacity-80 hover:opacity-100">
             <X size={24} />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-end mb-8 border-b border-alan-primary/20 pb-2">
            <div>
               <h1 className="text-3xl font-bold tracking-[0.2em] text-alan-primary flex items-center gap-4">
                 COMMAND CENTER
                 <span className="text-xs font-mono bg-alan-primary/20 px-2 py-1 rounded text-alan-primary border border-alan-primary/50">V.4.0.2</span>
               </h1>
               <p className="font-mono text-xs text-alan-secondary/60 mt-1">SYSTEM ADMINISTRATOR PANEL // {envInfo}</p>
            </div>
          </div>

          {/* Content Views */}
          <div className="flex-1 relative">
             <CornerBrackets />
             
             {/* OVERVIEW TAB */}
             {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-appear">
                   <StatCard label="CPU LOAD" value={`${systemState.meta.cpuLoad}%`} subtext="NEURAL ENGINE" active={systemState.processing} />
                   <StatCard label="MEMORY" value={`${systemState.meta.memoryUsage} MB`} subtext="HEAP ALLOCATION" />
                   <StatCard label="NETWORK" value={navigator.onLine ? "CONNECTED" : "OFFLINE"} subtext="LATENCY: 24ms" active={navigator.onLine} />
                   <StatCard label="UPTIME" value={`${Math.floor(systemState.meta.uptime / 60)}m`} subtext="SESSION DURATION" />

                   {/* WORLD MODEL CARD */}
                   <div className="md:col-span-2 bg-alan-primary/5 border border-alan-primary/20 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-20">
                          <Globe size={64} />
                      </div>
                      <h3 className="text-sm font-mono text-alan-primary mb-4 flex items-center gap-2 relative z-10">
                          <MapPin size={16} /> WORLD MODEL (LAYER 5)
                      </h3>
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                         <div className="space-y-1">
                             <div className="text-[10px] font-mono text-alan-secondary/60">LOCAL TIME</div>
                             <div className="text-xl font-bold text-alan-primary">{systemState.world.timeString}</div>
                             <div className="text-[10px] font-mono text-alan-primary/50">{systemState.world.dateString}</div>
                         </div>
                         <div className="space-y-1">
                             <div className="text-[10px] font-mono text-alan-secondary/60">GPS COORDINATES</div>
                             <div className="text-sm font-mono text-alan-primary tracking-wider">{systemState.world.location.label}</div>
                         </div>
                         <div className="col-span-2 border-t border-alan-primary/10 pt-2 flex justify-between items-center">
                             <div>
                                <div className="text-[10px] font-mono text-alan-secondary/60">ENVIRONMENT SCAN</div>
                                <div className="text-xs text-alan-primary/80">{systemState.world.environmentLabel}</div>
                             </div>
                             <div className="text-right">
                                <div className="text-[10px] font-mono text-alan-secondary/60">THREAT LEVEL</div>
                                <div className={`text-sm font-bold tracking-widest ${getThreatColor(systemState.world.threatLevel)}`}>
                                    {systemState.world.threatLevel}
                                </div>
                             </div>
                         </div>
                      </div>
                   </div>

                   {/* SETTINGS SHORTCUT */}
                   <div className="md:col-span-2 bg-alan-primary/5 border border-alan-primary/20 p-6 flex items-center justify-between group hover:bg-alan-primary/10 transition-colors">
                      <div>
                          <h3 className="text-sm font-bold text-alan-primary flex items-center gap-2">
                              <Settings size={16} /> SYSTEM CONFIGURATION
                          </h3>
                          <p className="text-xs text-alan-secondary/60 font-mono mt-1">
                              Modify Personality, Voice Synthesis, and Core Protocols.
                          </p>
                      </div>
                      <Button onClick={() => setActiveTab('config')} active={true}>
                          ACCESS ALL SETTINGS
                      </Button>
                   </div>
                </div>
             )}

             {/* SECURITY TAB */}
             {activeTab === 'security' && (
                 <div className="animate-appear grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-black/40 border border-alan-primary/20 p-6 flex flex-col items-center justify-center text-center">
                         <div className={`p-4 rounded-full mb-4 ${systemState.security.isLocked ? 'bg-alan-accent/20 text-alan-accent animate-pulse' : 'bg-alan-success/20 text-alan-success'}`}>
                             <Lock size={48} />
                         </div>
                         <h3 className="text-lg font-bold text-alan-primary tracking-widest mb-1">
                             SYSTEM IS {systemState.security.isLocked ? 'LOCKED' : 'ARMED'}
                         </h3>
                         <div className="text-xs font-mono text-alan-secondary/50 mb-4">ACCESS LEVEL: {systemState.security.accessLevel}</div>
                     </div>
                     
                     <div className="bg-black/40 border border-alan-primary/20 p-6 space-y-4">
                         <h3 className="text-sm font-mono text-alan-primary border-b border-alan-primary/20 pb-2">SECURITY PROTOCOLS (LAYER 10)</h3>
                         
                         <div className="flex justify-between items-center">
                             <div className="text-xs font-mono text-alan-secondary">ENCRYPTION LEVEL</div>
                             <div className="text-xs font-bold text-alan-primary">{systemState.security.encryptionLevel}</div>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="text-xs font-mono text-alan-secondary">PRIVACY MODE</div>
                             <div className={`text-xs font-bold ${systemState.security.privacyMode ? 'text-alan-success' : 'text-alan-secondary/50'}`}>
                                 {systemState.security.privacyMode ? 'ACTIVE' : 'DISABLED'}
                             </div>
                         </div>
                         <Button active={false} className="w-full mt-4">
                             TRIGGER EMERGENCY LOCKDOWN
                         </Button>
                     </div>
                 </div>
             )}

             {/* META TAB */}
             {activeTab === 'meta' && (
                 <div className="animate-appear space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <StatCard label="SYSTEM HEALTH" value={`${systemState.meta.systemHealth}%`} subtext="META-LAYER MONITOR" />
                         <StatCard label="ALIGNMENT" value={`${systemState.meta.alignmentScore}/100`} subtext="ETHICAL GUARDRAILS" />
                         <StatCard label="CORE TEMP" value={`${systemState.meta.temperature}°C`} subtext="HARDWARE SENSOR" />
                     </div>

                     <div className="bg-alan-primary/5 border border-alan-primary/20 p-6">
                         <h3 className="text-sm font-mono text-alan-primary mb-4 flex items-center gap-2">
                             <Activity size={16} /> RESOURCE OBSERVABILITY
                         </h3>
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-xs font-mono mb-1 text-alan-secondary">
                                     <span>CPU THREAD ALLOCATION</span>
                                     <span>{systemState.meta.cpuLoad}%</span>
                                 </div>
                                 <ProgressBar value={systemState.meta.cpuLoad} />
                             </div>
                             <div>
                                 <div className="flex justify-between text-xs font-mono mb-1 text-alan-secondary">
                                     <span>HEAP UTILIZATION</span>
                                     <span>{Math.min(100, (systemState.meta.memoryUsage / 512) * 100)}%</span>
                                 </div>
                                 <ProgressBar value={Math.min(100, (systemState.meta.memoryUsage / 512) * 100)} />
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* KNOWLEDGE GRAPH TAB */}
             {activeTab === 'graph' && (
                 <div className="animate-appear h-full flex flex-col items-center justify-center bg-black/40 border border-alan-primary/20 relative overflow-hidden">
                     <div className="absolute inset-0 opacity-20 pointer-events-none">
                        {/* Simulated Graph Nodes */}
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-alan-primary rounded-full shadow-[0_0_10px_cyan]" />
                        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-alan-primary rounded-full shadow-[0_0_15px_cyan]" />
                        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-alan-secondary rounded-full" />
                        <svg className="absolute inset-0 w-full h-full">
                            <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" className="text-alan-primary/50" />
                            <line x1="50%" y1="50%" x2="75%" y2="66%" stroke="currentColor" strokeWidth="1" className="text-alan-primary/50" />
                        </svg>
                     </div>
                     <div className="z-10 text-center">
                         <Network size={48} className="mx-auto text-alan-primary mb-4 animate-pulse-slow" />
                         <h3 className="text-lg font-bold text-alan-primary">KNOWLEDGE GRAPH VISUALIZATION</h3>
                         <p className="text-xs font-mono text-alan-secondary/60 mt-2">
                             Visualizing Semantic Links in Layer 7
                         </p>
                         <Button className="mt-6" active={false}>
                             FORCE RE-INDEX
                         </Button>
                     </div>
                 </div>
             )}

             {/* TASKS TAB (Layer 6 Visualization) */}
             {activeTab === 'tasks' && (
                 <div className="animate-appear">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-mono text-alan-primary/70 uppercase border-l-2 border-alan-primary pl-2">Mission Control (Layer 6)</h3>
                         <div className="text-[10px] font-mono text-alan-secondary">
                             {systemState.activePlan ? `PLAN_ID: ${systemState.activePlan.id}` : 'NO ACTIVE MISSION'}
                         </div>
                     </div>
                     
                     {!systemState.activePlan ? (
                         <div className="p-12 border border-dashed border-alan-primary/20 text-center text-alan-secondary/50 font-mono">
                             <List className="mx-auto mb-4 opacity-50" size={32} />
                             AWAITING COMPLEX INSTRUCTION...
                         </div>
                     ) : (
                         <div className="space-y-6">
                             <div className="bg-alan-primary/5 border border-alan-primary/20 p-4">
                                 <div className="flex justify-between mb-2">
                                     <span className="text-xs text-alan-secondary font-mono">MISSION PROGRESS</span>
                                     <span className="text-xs text-alan-primary font-bold">{systemState.activePlan.progress}%</span>
                                 </div>
                                 <ProgressBar value={systemState.activePlan.progress} />
                             </div>

                             <div className="grid gap-3">
                                 {systemState.activePlan.tasks.map((task) => (
                                     <div key={task.id} className={`p-4 border-l-4 transition-all ${
                                         task.status === TaskStatus.COMPLETED ? 'bg-alan-success/5 border-alan-success' : 
                                         task.status === TaskStatus.IN_PROGRESS ? 'bg-alan-primary/10 border-alan-primary animate-pulse' : 
                                         task.status === TaskStatus.FAILED ? 'bg-alan-accent/10 border-alan-accent' :
                                         'bg-black/40 border-alan-secondary/30'
                                     }`}>
                                         <div className="flex items-start justify-between">
                                             <div className="flex gap-3">
                                                 <div className="mt-1">
                                                     {task.status === TaskStatus.COMPLETED ? <CheckCircle size={16} className="text-alan-success" /> :
                                                      task.status === TaskStatus.IN_PROGRESS ? <Activity size={16} className="text-alan-primary animate-spin" /> :
                                                      task.status === TaskStatus.FAILED ? <AlertTriangle size={16} className="text-alan-accent" /> :
                                                      <Circle size={16} className="text-alan-secondary/30" />}
                                                 </div>
                                                 <div>
                                                     <div className="text-sm font-bold text-alan-secondary">{task.description}</div>
                                                     <div className="text-[10px] font-mono text-alan-secondary/50 mt-1 uppercase flex gap-2">
                                                         <span>TOOL: {task.tool}</span>
                                                         <span>// STATUS: {task.status}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {/* INPUTS TAB */}
             {activeTab === 'inputs' && (
                <div className="animate-appear space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-alan-primary/5 border border-alan-primary/20 flex flex-col items-center justify-center text-center hover:bg-alan-primary/10 transition-colors cursor-pointer group">
                             <Mic size={32} className={`mb-4 ${settings.voiceEnabled ? 'text-alan-primary' : 'text-alan-secondary/50'}`} />
                             <h3 className="text-sm font-bold text-alan-primary">VOICE INPUT</h3>
                             <p className="text-xs text-alan-secondary/60 mt-2 font-mono">Microphone Array: {settings.voiceEnabled ? 'ACTIVE' : 'DISABLED'}</p>
                             <Button onClick={() => onUpdateSettings({...settings, voiceEnabled: !settings.voiceEnabled})} active={settings.voiceEnabled} className="mt-4 w-full">
                                {settings.voiceEnabled ? 'DEACTIVATE' : 'ACTIVATE'}
                             </Button>
                        </div>

                        <div className="p-6 bg-alan-primary/5 border border-alan-primary/20 flex flex-col items-center justify-center text-center hover:bg-alan-primary/10 transition-colors cursor-pointer group">
                             <Camera size={32} className={`mb-4 ${settings.cameraEnabled ? 'text-alan-primary' : 'text-alan-secondary/50'}`} />
                             <h3 className="text-sm font-bold text-alan-primary">VISUAL INPUT</h3>
                             <p className="text-xs text-alan-secondary/60 mt-2 font-mono">Camera Feed: {settings.cameraEnabled ? 'LIVE' : 'OFFLINE'}</p>
                             <Button onClick={() => onUpdateSettings({...settings, cameraEnabled: !settings.cameraEnabled})} active={settings.cameraEnabled} className="mt-4 w-full">
                                {settings.cameraEnabled ? 'CUT FEED' : 'OPEN EYE'}
                             </Button>
                        </div>
                    </div>
                </div>
             )}

             {/* CONFIG TAB */}
             {activeTab === 'config' && (
                 <div className="animate-appear space-y-6 max-w-3xl">
                     <h3 className="text-sm font-mono text-alan-primary border-b border-alan-primary/20 pb-2 mb-4">SYSTEM CONFIGURATION</h3>
                     
                     {/* Identity */}
                     <div className="bg-alan-primary/5 p-4 border border-alan-primary/10">
                         <label className="text-xs font-mono text-alan-secondary block mb-2 tracking-widest">USER IDENTITY</label>
                         <input 
                             type="text" 
                             className="w-full bg-black border border-alan-primary/30 text-alan-primary text-sm p-3 font-mono outline-none focus:border-alan-primary"
                             value={settings.userName}
                             onChange={(e) => onUpdateSettings({...settings, userName: e.target.value})}
                         />
                     </div>

                     {/* Personality */}
                     <div className="bg-alan-primary/5 p-4 border border-alan-primary/10">
                         <label className="text-xs font-mono text-alan-secondary block mb-2 tracking-widest">PERSONALITY MATRIX</label>
                         <div className="flex gap-2">
                             {['jarvis', 'tars', 'hybrid'].map(p => (
                                 <Button 
                                     key={p} 
                                     active={settings.personality === p} 
                                     onClick={() => onUpdateSettings({...settings, personality: p as any})} 
                                     className="flex-1"
                                 >
                                     {p.toUpperCase()}
                                 </Button>
                             ))}
                         </div>
                     </div>

                     {/* Humor Level */}
                     <div className="bg-alan-primary/5 p-4 border border-alan-primary/10">
                         <RangeSlider 
                             label="HUMOR SETTING" 
                             value={settings.humorLevel} 
                             onChange={(v) => onUpdateSettings({...settings, humorLevel: v})} 
                         />
                     </div>

                     {/* Voice Selection */}
                     <div className="bg-alan-primary/5 p-4 border border-alan-primary/10">
                         <label className="text-xs font-mono text-alan-secondary block mb-2 tracking-widest">VOCAL SYNTHESIS</label>
                         <select 
                             className="w-full bg-black border border-alan-primary/30 text-alan-primary text-xs p-3 font-mono outline-none focus:border-alan-primary"
                             value={settings.voiceURI}
                             onChange={(e) => onUpdateSettings({...settings, voiceURI: e.target.value})}
                         >
                             <option value="">DEFAULT SYSTEM VOICE</option>
                             {availableVoices.map(v => (
                                 <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                             ))}
                         </select>
                     </div>

                     {/* Custom Instructions */}
                     <div className="bg-alan-primary/5 p-4 border border-alan-primary/10">
                         <label className="text-xs font-mono text-alan-secondary block mb-2 tracking-widest">SYSTEM OVERRIDES (CUSTOM PROMPT)</label>
                         <textarea 
                             className="w-full bg-black border border-alan-primary/30 text-alan-primary text-sm p-3 font-mono outline-none focus:border-alan-primary h-24 resize-none"
                             value={settings.customInstructions}
                             onChange={(e) => onUpdateSettings({...settings, customInstructions: e.target.value})}
                             placeholder="Enter strict protocol overrides..."
                         />
                     </div>
                 </div>
             )}

             {/* PLUGINS TAB */}
             {activeTab === 'plugins' && (
                 <div className="animate-appear">
                    <h3 className="text-sm font-mono text-alan-primary border-b border-alan-primary/20 pb-2 mb-6">EXTENSION MODULES (LAYER 11)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AVAILABLE_PLUGINS.map(plugin => (
                            <div key={plugin.id} className={`p-4 border transition-all ${settings.plugins[plugin.id] ? 'bg-alan-primary/10 border-alan-primary' : 'bg-black/40 border-alan-secondary/20'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${settings.plugins[plugin.id] ? 'bg-alan-primary/20 text-alan-primary' : 'bg-alan-secondary/10 text-alan-secondary'}`}>
                                            <Box size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-alan-primary">{plugin.name}</h4>
                                            <p className="text-[10px] font-mono text-alan-secondary/60">V.{plugin.version}</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out cursor-pointer" onClick={() => togglePlugin(plugin.id)}>
                                        <div className={`block w-10 h-6 rounded-full border ${settings.plugins[plugin.id] ? 'bg-alan-primary/20 border-alan-primary' : 'bg-black border-alan-secondary/30'}`} />
                                        <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${settings.plugins[plugin.id] ? 'bg-alan-primary translate-x-4 shadow-[0_0_10px_cyan]' : 'bg-alan-secondary/50'}`} />
                                    </div>
                                </div>
                                <p className="text-xs text-alan-secondary mt-3 leading-relaxed">
                                    {plugin.description}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {plugin.capabilities.map(cap => (
                                        <span key={cap} className="text-[9px] px-1.5 py-0.5 bg-black border border-alan-secondary/20 rounded text-alan-secondary/70">
                                            {cap}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
