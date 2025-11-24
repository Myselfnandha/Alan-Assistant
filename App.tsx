import React, { useState } from 'react';
import { Mic, MicOff, Send, Settings, RefreshCw, X, Camera, Eye, Sliders, Activity, Database, ShieldAlert, Cpu } from 'lucide-react';
import { DEFAULT_SETTINGS } from './constants';
import { useAlanSystem } from './hooks/useAlanSystem';
import Visualizer from './components/Visualizer';
import { Card, Button, TerminalText, RangeSlider, BootSequence, CornerBrackets } from './components/HolographicComponents';
import CameraInput from './components/CameraInput';
import { MessageSender } from './types';

const App: React.FC = () => {
  const [booting, setBooting] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'chat'>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { messages, systemState, processInput, processVisualInput, toggleListening } = useAlanSystem(settings);

  // Auto-scroll chat
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      processInput(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  // Determine Visualizer State
  let visualizerState: 'idle' | 'listening' | 'speaking' | 'processing' = 'idle';
  if (systemState.speaking) visualizerState = 'speaking';
  else if (systemState.processing) visualizerState = 'processing';
  else if (systemState.listening) visualizerState = 'listening';

  return (
    <div className="h-screen bg-alan-bg text-alan-secondary font-display flex flex-col md:flex-row overflow-hidden relative">
      {/* Global HUD Effects */}
      <div className="scanlines" />
      <div className="vignette" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-appear">
          <div className="w-full max-w-2xl bg-alan-bg/95 border border-alan-primary/40 p-1 relative shadow-[0_0_100px_rgba(0,240,255,0.1)]">
             <CornerBrackets />
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-alan-primary to-transparent opacity-50" />
             
             <div className="p-6 md:p-8 relative z-10">
                <div className="flex justify-between items-start mb-8 border-b border-alan-primary/20 pb-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-alan-primary tracking-[0.2em] flex items-center gap-3">
                        <Settings className="animate-spin-slow" />
                        SYSTEM_CONFIG
                    </h2>
                    <p className="text-xs font-mono text-alan-secondary/60 mt-1">ACCESS LEVEL: ADMINISTRATOR</p>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-alan-primary/50 hover:text-alan-accent transition-colors">
                      <X size={32} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Column 1: Core Toggles */}
                   <div className="space-y-6">
                      <h3 className="text-sm font-mono text-alan-primary/70 uppercase border-l-2 border-alan-primary pl-2">Core Modules</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button active={settings.voiceEnabled} onClick={() => setSettings(p => ({...p, voiceEnabled: !p.voiceEnabled}))} className="gap-2">
                            {settings.voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />} VOICE
                        </Button>
                        <Button active={settings.cameraEnabled} onClick={() => setSettings(p => ({...p, cameraEnabled: !p.cameraEnabled}))} className="gap-2">
                            <Camera size={16} /> VISION
                        </Button>
                        <Button active={settings.offlineMode} onClick={() => setSettings(p => ({...p, offlineMode: !p.offlineMode}))} className="gap-2">
                            <ShieldAlert size={16} /> SECURE
                        </Button>
                        <Button active={settings.wakeWordEnabled} onClick={() => setSettings(p => ({...p, wakeWordEnabled: !p.wakeWordEnabled}))} className="gap-2">
                            <Activity size={16} /> AWAKE
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-alan-primary/5 border border-alan-primary/20 mt-4">
                        <div className="flex items-center gap-2 text-alan-primary mb-2">
                            <Database size={14} />
                            <span className="text-xs font-mono tracking-widest">LOCAL STORAGE STATUS</span>
                        </div>
                        <div className="h-1 bg-alan-primary/20 w-full overflow-hidden">
                            <div className="h-full bg-alan-primary w-[35%] animate-pulse" />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-alan-secondary mt-1">
                            <span>USED: 342MB</span>
                            <span>FREE: 12GB</span>
                        </div>
                      </div>
                   </div>

                   {/* Column 2: Personality Matrix */}
                   <div className="space-y-6">
                      <h3 className="text-sm font-mono text-alan-primary/70 uppercase border-l-2 border-alan-primary pl-2">Personality Matrix</h3>
                      
                      <div className="p-6 bg-alan-primary/5 border border-alan-primary/20 relative overflow-hidden">
                         <div className="absolute top-2 right-2 opacity-20"><Cpu size={48} /></div>
                         <RangeSlider 
                            label="HUMOR SETTING" 
                            value={settings.humorLevel} 
                            onChange={(val) => setSettings(p => ({...p, humorLevel: val}))} 
                         />
                         <div className="mt-4 grid grid-cols-3 gap-1 text-[9px] font-mono text-center opacity-60">
                             <div className={`${settings.humorLevel < 30 ? 'text-alan-primary' : ''}`}>LOGICAL</div>
                             <div className={`${settings.humorLevel >= 30 && settings.humorLevel < 70 ? 'text-alan-primary' : ''}`}>BALANCED</div>
                             <div className={`${settings.humorLevel >= 70 ? 'text-alan-accent' : ''}`}>SARCASTIC</div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL: Sensory & System Status */}
      <div className={`
        flex-col md:w-5/12 lg:w-4/12 border-r border-alan-primary/20 bg-alan-glass/90 z-20 transition-all duration-300 relative
        ${activeTab === 'visual' ? 'flex w-full h-full' : 'hidden md:flex'}
      `}>
        {/* Network Status Header (Absolute) */}
        <div className="absolute top-4 left-4 z-30 flex gap-4 font-mono text-[10px] tracking-widest pointer-events-none">
           <div className="flex items-center gap-1">
              <span className="text-alan-secondary/50">NET:</span>
              {navigator.onLine ? <span className="text-alan-primary">ONLINE</span> : <span className="text-alan-accent">OFFLINE</span>}
           </div>
           <div className="flex items-center gap-1">
              <span className="text-alan-secondary/50">CPU:</span>
              <span className={systemState.processing ? "text-alan-warning" : "text-alan-primary"}>
                  {systemState.processing ? 'BUSY' : 'IDLE'}
              </span>
           </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none relative pt-10">
            {/* Visualizer Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[400px]">
              <Visualizer state={visualizerState} />

              {/* Terminal Log Under Visualizer */}
              <div className="mt-8 w-full max-w-sm relative opacity-80 hover:opacity-100 transition-opacity">
                <CornerBrackets />
                <div className="p-3 bg-alan-primary/5 backdrop-blur-sm">
                    <h3 className="text-[9px] font-mono text-alan-primary uppercase mb-2 flex justify-between tracking-widest border-b border-alan-primary/20 pb-1">
                        <span>Terminal Stream</span>
                        <span className="text-alan-secondary">LOG_01</span>
                    </h3>
                    <div className="h-16 overflow-hidden flex flex-col-reverse space-y-1 space-y-reverse">
                        {messages.slice(-4).reverse().map((m) => (
                        <TerminalText key={m.id} text={`[${m.sender}] ${m.text.substring(0, 40)}...`} />
                        ))}
                    </div>
                </div>
              </div>
            </div>

            {/* Camera Feed Area */}
            <div className="px-4 shrink-0 pb-4">
                <CameraInput 
                    active={settings.cameraEnabled} 
                    autoMode={true} 
                    onCapture={(b64) => processVisualInput(b64)} 
                />
                 {/* Visual Context HUD Display */}
                {settings.cameraEnabled && systemState.visualContext && (
                    <div className="mb-2 p-2 bg-alan-primary/5 border-l-2 border-alan-primary/50 text-[10px] font-mono text-alan-primary/90 h-12 overflow-y-auto animate-appear scrollbar-thin">
                        <div className="flex items-center gap-2 mb-1 text-alan-accent opacity-80">
                            <Eye size={10} /> 
                            <span>VISUAL_ANALYSIS_BUFFER</span>
                        </div>
                        {systemState.visualContext}
                    </div>
                )}
            </div>
        </div>

        {/* ICON DOCK (Fixed at bottom) */}
        <div className="p-6 border-t border-alan-primary/20 bg-black/40 backdrop-blur-md shrink-0">
           <div className="flex justify-around items-center">
              {/* Vision Toggle */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setSettings(p => ({...p, cameraEnabled: !p.cameraEnabled}))}>
                 <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 ${settings.cameraEnabled ? 'border-alan-primary bg-alan-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'border-alan-secondary/30 bg-transparent hover:border-alan-primary/50'}`}>
                    <Camera size={20} className={settings.cameraEnabled ? 'text-alan-primary' : 'text-alan-secondary'} />
                 </div>
                 <span className="text-[10px] font-mono tracking-widest text-alan-secondary group-hover:text-alan-primary transition-colors">VISION</span>
              </div>

              {/* Listening Toggle */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={toggleListening}>
                 <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${systemState.listening ? 'border-alan-accent bg-alan-accent/10 shadow-[0_0_20px_rgba(255,0,60,0.4)] animate-pulse' : 'border-alan-secondary/30 bg-transparent hover:border-alan-primary/50'}`}>
                    {systemState.listening ? <MicOff size={24} className="text-alan-accent" /> : <Mic size={24} className="text-alan-secondary group-hover:text-alan-primary" />}
                 </div>
                 <span className="text-[10px] font-mono tracking-widest text-alan-secondary group-hover:text-alan-primary transition-colors">AUDIO</span>
              </div>

               {/* Config Toggle */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                 <div className="w-12 h-12 rounded-full border border-alan-secondary/30 flex items-center justify-center bg-transparent hover:border-alan-primary/50 hover:bg-alan-primary/5 transition-all duration-300">
                    <Sliders size={20} className="text-alan-secondary group-hover:text-alan-primary" />
                 </div>
                 <span className="text-[10px] font-mono tracking-widest text-alan-secondary group-hover:text-alan-primary transition-colors">SYSTEM</span>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT PANEL: Chat Interface */}
      <div className={`
        flex-col flex-1 bg-transparent z-10 relative
        ${activeTab === 'chat' ? 'flex w-full h-full' : 'hidden md:flex'}
      `}>
        {/* Mobile Tabs */}
        <div className="md:hidden flex border-b border-alan-primary/20 bg-alan-bg/90">
          <button onClick={() => setActiveTab('visual')} className={`flex-1 p-3 text-xs font-mono tracking-widest ${activeTab === 'visual' ? 'bg-alan-primary/10 text-alan-primary' : 'text-gray-500'}`}>SYS_VISUAL</button>
          <button onClick={() => setActiveTab('chat')} className={`flex-1 p-3 text-xs font-mono tracking-widest ${activeTab === 'chat' ? 'bg-alan-primary/10 text-alan-primary' : 'text-gray-500'}`}>SYS_COMM</button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative scrollbar-thin">
          {messages.length === 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                  <div className="w-24 h-24 border border-alan-primary/30 rounded-full flex items-center justify-center animate-pulse-slow">
                      <RefreshCw className="w-8 h-8 text-alan-primary animate-spin-slow" />
                  </div>
                  <p className="font-mono text-xs text-alan-primary mt-4 tracking-[0.3em]">AWAITING COMMAND</p>
             </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'} animate-appear`}>
              <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender === MessageSender.USER ? 'ml-auto' : ''}`}>
                 <Card 
                    title={msg.sender === MessageSender.USER ? 'COMMAND_INPUT' : 'RESPONSE_LOG'}
                    className={`${msg.sender === MessageSender.USER ? 'border-alan-secondary/50 bg-alan-secondary/5' : 'border-alan-primary/50'}`}
                 >
                    <div className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</div>
                 </Card>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 border-t border-alan-primary/20 bg-alan-glass/95 backdrop-blur-xl">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative group">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ENTER INSTRUCTION..."
                className="w-full bg-black/40 border-b-2 border-alan-primary/30 py-3 px-4 text-alan-secondary placeholder-alan-secondary/20 focus:outline-none focus:border-alan-primary focus:bg-alan-primary/5 font-mono text-sm transition-all uppercase tracking-wider"
              />
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-alan-primary transition-all duration-500 group-hover:w-full" />
            </div>

            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-4 bg-alan-primary/10 border border-alan-primary/30 text-alan-primary hover:bg-alan-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors clip-corners"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;