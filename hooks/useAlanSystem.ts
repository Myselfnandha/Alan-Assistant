import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSender, ChatMessage, SystemState, LayerStatus, AlanSettings } from '../types';
import { generateAlanResponse, analyzeImage } from '../services/geminiService';
import { VoiceListener, speak } from '../services/speechService';
import { OFFLINE_COMMANDS } from '../constants';

export const useAlanSystem = (settings: AlanSettings) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({
    listening: false,
    speaking: false,
    processing: false,
    layerStatuses: {
      'L1-INPUT': LayerStatus.IDLE,
      'L3-REASONING': LayerStatus.IDLE,
      'L5-VISION': LayerStatus.IDLE,
      'L9-OUTPUT': LayerStatus.IDLE,
    },
    lastIntent: null,
    visualContext: null,
  });

  const voiceListenerRef = useRef<VoiceListener | null>(null);

  // Initialize Welcome Message
  useEffect(() => {
    addMessage("System Initialized. ALAN operating at 100% efficiency.", MessageSender.ALAN);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLayerStatus = (layer: string, status: LayerStatus) => {
    setSystemState(prev => ({
      ...prev,
      layerStatuses: { ...prev.layerStatuses, [layer]: status }
    }));
  };

  const addMessage = (text: string, sender: MessageSender) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Background Visual Analysis (Does not trigger chat/speech)
  const processVisualInput = async (base64: string) => {
    if (settings.offlineMode) return;
    
    updateLayerStatus('L5-VISION', LayerStatus.PROCESSING);
    try {
        const description = await analyzeImage(base64);
        setSystemState(prev => ({ ...prev, visualContext: description }));
        updateLayerStatus('L5-VISION', LayerStatus.ACTIVE);
    } catch (e) {
        updateLayerStatus('L5-VISION', LayerStatus.ERROR);
    }
  };

  const processInput = async (input: string, imageBase64?: string) => {
    if (!input.trim()) return;

    // Layer 1: Input Received
    addMessage(input, MessageSender.USER);
    updateLayerStatus('L1-INPUT', LayerStatus.ACTIVE);
    
    // Offline Check
    if (settings.offlineMode || !navigator.onLine) {
      updateLayerStatus('L3-REASONING', LayerStatus.OFFLINE);
      const command = OFFLINE_COMMANDS.find(cmd => cmd.pattern.test(input));
      const response = command ? command.response() : "Offline. Command not recognized in local database.";
      
      setTimeout(() => {
        addMessage(response, MessageSender.ALAN);
        if (settings.voiceEnabled) speak(response);
        updateLayerStatus('L1-INPUT', LayerStatus.IDLE);
        updateLayerStatus('L3-REASONING', LayerStatus.IDLE);
      }, 500);
      return;
    }

    // Layer 3: Reasoning (Gemini)
    setSystemState(prev => ({ ...prev, processing: true }));
    updateLayerStatus('L3-REASONING', LayerStatus.PROCESSING);

    try {
      // Build history for context (Last 5 messages)
      const history = messages.slice(-5).map(m => ({
        role: m.sender === MessageSender.USER ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      // Inject visual context if available and no specific image provided
      let prompt = input;
      if (!imageBase64 && systemState.visualContext) {
        prompt += `\n[System Note: Current Visual Environment contains: ${systemState.visualContext}]`;
      }

      const responseText = await generateAlanResponse(prompt, history, settings, imageBase64);
      
      addMessage(responseText, MessageSender.ALAN);
      updateLayerStatus('L3-REASONING', LayerStatus.ACTIVE);

      // Layer 9: Output
      if (settings.voiceEnabled) {
        setSystemState(prev => ({ ...prev, speaking: true }));
        updateLayerStatus('L9-OUTPUT', LayerStatus.ACTIVE);
        speak(responseText, () => {
          setSystemState(prev => ({ ...prev, speaking: false }));
          updateLayerStatus('L9-OUTPUT', LayerStatus.IDLE);
        });
      }

    } catch (error) {
      addMessage("Error in neural processing.", MessageSender.SYSTEM);
      updateLayerStatus('L3-REASONING', LayerStatus.ERROR);
    } finally {
      setSystemState(prev => ({ ...prev, processing: false }));
      updateLayerStatus('L3-REASONING', LayerStatus.IDLE);
      updateLayerStatus('L1-INPUT', LayerStatus.IDLE);
    }
  };

  const toggleListening = useCallback(() => {
    if (systemState.listening) {
      voiceListenerRef.current?.stop();
      setSystemState(prev => ({ ...prev, listening: false }));
    } else {
      if (!voiceListenerRef.current) {
        voiceListenerRef.current = new VoiceListener(
          (text) => processInput(text),
          () => setSystemState(prev => ({ ...prev, listening: false }))
        );
      }
      voiceListenerRef.current.start();
      setSystemState(prev => ({ ...prev, listening: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemState.listening]); 

  return {
    messages,
    systemState,
    processInput,
    processVisualInput,
    toggleListening
  };
};