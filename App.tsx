
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Camera, Eye, Sliders, RefreshCw, Paperclip, Clipboard, LayoutGrid, X, Lock } from 'lucide-react';
import { DEFAULT_SETTINGS } from './constants';
import { useAlanSystem } from './hooks/useAlanSystem';
import Visualizer from './components/Visualizer';
import { Card, Button, TerminalText, BootSequence, CornerBrackets } from './components/HolographicComponents';
import CameraInput from './components/CameraInput';
import CommandCenter from './components/CommandCenter';
import ReasoningHUD from './components/ReasoningHUD'; 
import { RichOutputRenderer } from './components/RichOutputRenderer';
import { MessageSender, Attachment, ReasoningMode } from './types';

const App: React.FC = () => {
  const [booting, setBooting] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'chat'>('chat');
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pin, setPin] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, systemState, processInput, processVisualInput, toggleListening, unlockSystem } = useAlanSystem(settings);

  // Auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() || attachments.length > 0) {
      processInput(inputText, attachments);
      setInputText('');
      setAttachments([]);
    }
  };

  const handleUnlock = async () => {
      const success = await unlockSystem(pin);
      if (!success) {
          alert("Access Denied");
          setPin("");
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const isImage = file.type.startsWith('image/');
        
        let data = result;
        if (isImage) {
           data = result.split(',')[1]; // Strip base64 prefix for API
        }

        const newAttachment: Attachment = {
           name: file.name,
           type: isImage ? 'image' : 'text', // Simple classification
           mimeType: file.type,
           data: data
        };
        setAttachments(prev => [...prev, newAttachment]);
      };

      if (file.type.startsWith('image/')) {
         reader.readAsDataURL(file);
      } else {
         reader.readAsText(file);
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputText(prev => prev + text);
    } catch (err) {
      console.error("Clipboard access denied");
    }
  };

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  // SECURITY OVERLAY (Layer 10)
  if (systemState.security.isLocked) {
      return (
          <div className="h-screen bg-alan-bg flex items-center justify-center relative overflow-hidden">
              <div className="scanlines" />
              <div className="vignette" />
              <div className="relative z-20 flex flex-col items-center gap-6 p-8 bg-alan-glass/50 border border-alan-primary/30 rounded-lg backdrop-blur-md animate-appear">
                  <Lock size={64} className="text-alan-primary animate-pulse" />
                  <h1 className="text-2xl font-display font-bold text-alan-primary tracking-widest">SYSTEM LOCKED</h1>
                  <div className="flex flex-col gap-2 w-64">
                      <input 
                        type="password" 
                        placeholder="ENTER ACCESS CODE" 
                        className="bg-black/50 border border-alan-primary/30 p-3 text-center text-alan-primary font-mono tracking-[0.5em] outline-none focus:border-alan-primary"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                      />
                      <Button onClick={handleUnlock} active={true}>AUTHENTICATE</Button>
                      <div className="text-center text-[10px] text-alan-secondary/50 font-mono mt-2">
                          DEFAULT: 1234
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Determine Visualizer State
  let visualizerState: 'idle' | 'listening' | 'speaking' | 'processing' = 'idle';
  if (systemState.speaking) visualizerState = 'speaking';
  else if (systemState.processing) visualizerState = 'processing';
  else if (systemState.listening) visualizerState = 'listening';

  const lastMsg = messages[messages.length - 1];
  const activeThoughts = systemState.processing ? null : (lastMsg?.metadata?.thoughtProcess || null);

  return (
    <div className="h-screen bg-alan-bg text-alan-secondary font-display flex flex-col md:flex-row overflow-hidden relative">
      {/* Global HUD Effects */}
      <div className="scanlines" />
      <div className="vignette" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Command Center Overlay */}
      <CommandCenter 
        isOpen={isCommandCenterOpen} 
        onClose={() => setIsCommandCenterOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        systemState={systemState}
        logs={messages.map(m => `[${m.sender}] ${m.text.substring(0, 50)}...`)}
      />

      {/* LEFT PANEL: Sensory & System Status */}
      <div className={`
        flex-col md:w-5/12 lg:w-4/12 border-r border-alan-primary/20 bg-alan-glass/90 z-20 transition-all duration-300 relative
        ${activeTab === 'visual' ? 'flex w-full h-full' : 'hidden md:flex'}
      `}>
        {/* Network Status Header */}
        <div className="absolute top-4 left-4 z-30 flex gap-4 font-mono text-[10px] tracking-widest pointer-events-none">
           <div className="flex items-center gap-1">
              <span className="text-alan-secondary/50">NET:</span>
              {navigator.onLine ? <span className="text-alan-primary">ONLINE</span> : <span className="text-alan-accent">OFFLINE</span>}
           </div>
           <div className="flex items-center gap-1">
              <span className="text-alan-secondary/50">CPU:</span>
              <span className={systemState.processing ? "text-alan-warning" : "text-alan-primary"}>
                  {systemState.meta.cpuLoad}%
              </span>
           </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none relative pt-10">
            {/* Visualizer Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[400px] relative">
              <Visualizer state={visualizerState} />

              {/* REASONING HUD (Overlays visualizer when thinking or showing thoughts) */}
              <ReasoningHUD 
                 active={systemState.processing && systemState.reasoningMode === ReasoningMode.DEEP} 
                 mode={systemState.reasoningMode}
                 thoughts={activeThoughts}
              />

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

               {/* Command Center Toggle */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setIsCommandCenterOpen(true)}>
                 <div className="w-12 h-12 rounded-full border border-alan-secondary/30 flex items-center justify-center bg-transparent hover:border-alan-primary/50 hover:bg-alan-primary/5 transition-all duration-300">
                    <LayoutGrid size={20} className="text-alan-secondary group-hover:text-alan-primary" />
                 </div>
                 <span className="text-[10px] font-mono tracking-widest text-alan-secondary group-hover:text-alan-primary transition-colors">GRID</span>
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
            <div key={msg.id} className={`flex flex-col ${msg.sender === MessageSender.USER ? 'items-end' : 'items-start'} animate-appear`}>
              <div className={`
                max-w-[85%] md:max-w-[75%] p-4 rounded-2xl backdrop-blur-sm border relative overflow-hidden group
                ${msg.sender === MessageSender.USER 
                  ? 'bg-alan-primary/10 border-alan-primary/30 text-alan-primary rounded-tr-none' 
                  : 'bg-alan-glass border-alan-primary/20 text-alan-secondary rounded-tl-none'}
              `}>
                {/* Holographic Scan Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[appear_1s_ease-in-out]" />

                {/* Sender Label */}
                <div className="text-[10px] font-mono tracking-widest opacity-50 mb-2 flex justify-between items-center gap-4">
                   <span>{msg.sender === MessageSender.USER ? settings.userName.toUpperCase() : 'ALAN_AI'}</span>
                   <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Attachments Display */}
                {msg.metadata?.attachments?.map((att, i) => (
                   <div key={i} className="mb-2 p-2 bg-black/40 rounded border border-alan-primary/20 flex items-center gap-2 max-w-full">
                       <Paperclip size={12} className="shrink-0" />
                       <span className="text-xs truncate">{att.name}</span>
                       <span className="text-[9px] px-1 bg-alan-primary/20 rounded ml-auto">{att.type.toUpperCase()}</span>
                   </div>
                ))}

                {/* Message Content */}
                {msg.sender === MessageSender.ALAN ? (
                   <RichOutputRenderer content={msg.text} />
                ) : (
                   <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                )}
                
                {/* Action Plan Metadata Badge */}
                {msg.metadata?.actionPlan && (
                   <div className="mt-3 pt-2 border-t border-alan-primary/10">
                       <div className="text-[10px] font-mono text-alan-secondary/60 flex items-center gap-2">
                           <LayoutGrid size={10} /> 
                           <span>EXECUTION_PLAN_GENERATED // ID: {msg.metadata.actionPlan.id.split('_')[1]}</span>
                       </div>
                   </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-alan-glass/90 border-t border-alan-primary/20 shrink-0">
            <div className="flex items-end gap-2 relative">
                {/* File Upload Hidden Input */}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                
                <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-lg border border-alan-primary/20 text-alan-primary/60 hover:text-alan-primary hover:bg-alan-primary/10 transition-colors">
                   <Paperclip size={20} />
                </button>
                
                <button onClick={handlePasteClipboard} className="hidden md:block p-3 rounded-lg border border-alan-primary/20 text-alan-primary/60 hover:text-alan-primary hover:bg-alan-primary/10 transition-colors">
                   <Clipboard size={20} />
                </button>

                <div className="flex-1 relative group">
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={systemState.listening ? "Listening to voice channel..." : "Enter command or query..."}
                        className="w-full bg-black/40 border border-alan-primary/30 rounded-lg p-3 pr-12 text-sm font-mono text-alan-primary placeholder-alan-secondary/30 focus:outline-none focus:border-alan-primary focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] resize-none h-12 py-3 transition-all"
                    />
                    {/* Attachments Preview in Input Bar */}
                    {attachments.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 flex gap-2">
                            {attachments.map((a, i) => (
                                <div key={i} className="bg-alan-primary/20 text-alan-primary text-xs px-2 py-1 rounded border border-alan-primary/40 flex items-center gap-1 backdrop-blur-md">
                                    {a.name} <X size={12} className="cursor-pointer hover:text-white" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                  onClick={inputText ? handleSend : toggleListening}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    inputText 
                      ? 'bg-alan-primary/20 border-alan-primary text-alan-primary hover:bg-alan-primary hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : systemState.listening 
                         ? 'bg-alan-accent/20 border-alan-accent text-alan-accent animate-pulse shadow-[0_0_20px_rgba(255,0,60,0.4)]'
                         : 'bg-alan-primary/5 border-alan-primary/30 text-alan-primary/60 hover:text-alan-primary'
                  }`}
                >
                   {inputText ? <Send size={20} /> : (systemState.listening ? <MicOff size={20} /> : <Mic size={20} />)}
                </button>
            </div>
            
            {/* Security Footer */}
            <div className="text-[10px] font-mono text-center mt-2 text-alan-secondary/30 tracking-[0.3em] flex justify-center items-center gap-4">
                <span>SECURE CHANNEL</span>
                <span>//</span>
                <span>ENC: {systemState.security.encryptionLevel}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
