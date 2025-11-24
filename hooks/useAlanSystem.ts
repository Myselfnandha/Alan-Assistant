
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSender, ChatMessage, SystemState, LayerStatus, AlanSettings, Attachment, UserIntent, Sentiment, ReasoningMode, ActionPlan, TaskStatus, LearningProfile } from '../types';
import { generateAlanResponse, analyzeImage } from '../services/geminiService';
import { processInputContext } from '../services/preProcessingService';
import { determineReasoningMode, parseModelOutput } from '../services/reasoningService';
import { parseActionPlan, executeNextTask } from '../services/actionPlanner'; 
import { VoiceListener, speak } from '../services/speechService';
import { memoryService } from '../services/memoryService';
import { learningService, getInitialProfile } from '../services/learningService';
import { getInitialWorldState, updateTime, updateLocation, inferEnvironment } from '../services/worldModelService';
import { securityService, initialSecurityState } from '../services/securityService'; // Layer 10
import { metaService, initialMetaState } from '../services/metaService'; // Layer 14
import { environmentService } from '../services/environmentService'; // Layer 12
import { OFFLINE_COMMANDS } from '../constants';

export const useAlanSystem = (settings: AlanSettings) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({
    listening: false,
    speaking: false,
    processing: false,
    layerStatuses: {
      'L1-INPUT': LayerStatus.IDLE,
      'L2-PREPROC': LayerStatus.IDLE,
      'L3-REASONING': LayerStatus.IDLE,
      'L4-MEMORY': LayerStatus.IDLE,
      'L5-VISION': LayerStatus.IDLE,
      'L6-PLANNING': LayerStatus.IDLE,
      'L9-OUTPUT': LayerStatus.IDLE,
      'L10-LEARNING': LayerStatus.IDLE,
      'L12-ENV': LayerStatus.IDLE,
      'L14-META': LayerStatus.ACTIVE
    },
    lastIntent: null,
    visualContext: null,
    currentSentiment: null,
    reasoningMode: ReasoningMode.SHALLOW,
    activeThought: null,
    activePlan: null,
    world: getInitialWorldState(),
    learningProfile: getInitialProfile(),
    security: initialSecurityState,
    meta: initialMetaState
  });

  const voiceListenerRef = useRef<VoiceListener | null>(null);

  // Initialize Memory Core, World Model, and Learning Profile
  useEffect(() => {
    memoryService.init()
        .then(() => learningService.analyzeProfile())
        .then((profile) => {
            setSystemState(prev => ({ ...prev, learningProfile: profile }));
            addMessage("System Initialized. ALAN operating at 100% efficiency.", MessageSender.ALAN);
        })
        .catch(err => console.error("Initialization failed", err));

    // Initial GPS Fix & Hardware Scan
    updateLocation(systemState.world).then(newWorld => {
        environmentService.getHardwareStatus().then(hw => {
            setSystemState(prev => ({ 
                ...prev, 
                world: { ...newWorld, hardware: { ...prev.world.hardware, ...hw } } 
            }));
        });
    });

    // Meta-Layer Heartbeat (1s)
    const metaInterval = setInterval(() => {
        setSystemState(prev => ({
            ...prev,
            meta: { ...prev.meta, ...metaService.runDiagnostics(prev) }
        }));
    }, 1000);

    // Time Loop (Every minute)
    const timeInterval = setInterval(() => {
        setSystemState(prev => ({ ...prev, world: updateTime(prev.world) }));
    }, 60000);

    return () => {
        clearInterval(metaInterval);
        clearInterval(timeInterval);
    };
  }, []);

  const updateLayerStatus = (layer: string, status: LayerStatus) => {
    setSystemState(prev => ({
      ...prev,
      layerStatuses: { ...prev.layerStatuses, [layer]: status }
    }));
  };

  const unlockSystem = async (pin: string): Promise<boolean> => {
      const valid = await securityService.authenticate(pin);
      if (valid) {
          setSystemState(prev => ({
              ...prev,
              security: { ...prev.security, isLocked: false, accessLevel: 'USER' }
          }));
          updateLayerStatus('L10-SECURITY', LayerStatus.ACTIVE);
      }
      return valid;
  };

  const addMessage = (text: string, sender: MessageSender, attachments?: Attachment[], processingInfo?: any, thoughtProcess?: any, actionPlan?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: Date.now(),
      metadata: (attachments && attachments.length > 0) || processingInfo || thoughtProcess || actionPlan ? { 
        attachments, 
        processingInfo,
        thoughtProcess,
        actionPlan
      } : undefined
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processVisualInput = async (base64: string) => {
    if (settings.offlineMode) return;
    
    updateLayerStatus('L5-VISION', LayerStatus.PROCESSING);
    try {
        const description = await analyzeImage(base64);
        const envUpdates = inferEnvironment(description);
        setSystemState(prev => ({ 
            ...prev, 
            visualContext: description,
            world: { ...prev.world, ...envUpdates }
        }));
        updateLayerStatus('L5-VISION', LayerStatus.ACTIVE);
    } catch (e) {
        updateLayerStatus('L5-VISION', LayerStatus.ERROR);
    }
  };

  // Execution Loop for Layer 6 Tasks
  useEffect(() => {
     const executePlan = async () => {
         if (systemState.activePlan && systemState.activePlan.status === TaskStatus.IN_PROGRESS) {
             const updatedPlan = await executeNextTask(systemState.activePlan);
             
             setSystemState(prev => ({ ...prev, activePlan: updatedPlan }));
             
             if (updatedPlan.status === TaskStatus.COMPLETED) {
                 updateLayerStatus('L6-PLANNING', LayerStatus.IDLE);
                 // Log success for Learning Layer
                 learningService.logInteraction(UserIntent.COMMAND, Sentiment.NEUTRAL, true, 'PLANNER');
             } else if (updatedPlan.status === TaskStatus.FAILED) {
                 learningService.logInteraction(UserIntent.COMMAND, Sentiment.NEGATIVE, false, 'PLANNER');
             }
         }
     };

     if (systemState.activePlan?.status === TaskStatus.IN_PROGRESS) {
         const timer = setTimeout(executePlan, 1000);
         return () => clearTimeout(timer);
     }
  }, [systemState.activePlan]);


  const processInput = async (input: string, attachments: Attachment[] = []) => {
    if (systemState.security.isLocked) return; // Security Gate
    if (!input.trim() && attachments.length === 0) return;

    // Layer 1: Input Received
    updateLayerStatus('L1-INPUT', LayerStatus.ACTIVE);

    // Layer 2: Pre-Processing
    updateLayerStatus('L2-PREPROC', LayerStatus.PROCESSING);
    const context = processInputContext(input, attachments);
    const reasoningMode = determineReasoningMode(context);
    
    setSystemState(prev => ({ 
      ...prev, 
      lastIntent: context.intent,
      currentSentiment: context.sentiment,
      reasoningMode: reasoningMode
    }));
    
    if (!context.safetyFlag) {
       addMessage("Input rejected. Security protocol violation detected.", MessageSender.SYSTEM);
       updateLayerStatus('L2-PREPROC', LayerStatus.ERROR);
       return;
    }

    addMessage(context.originalInput, MessageSender.USER, attachments, context);
    memoryService.saveEpisodicMemory('user', context.originalInput);
    updateLayerStatus('L2-PREPROC', LayerStatus.IDLE);
    
    // Offline Check
    if (settings.offlineMode || !navigator.onLine) {
      updateLayerStatus('L3-REASONING', LayerStatus.OFFLINE);
      const command = OFFLINE_COMMANDS.find(cmd => cmd.pattern.test(context.normalizedText));
      const response = command ? command.response() : "Offline. Command not recognized in local database.";
      
      setTimeout(() => {
        addMessage(response, MessageSender.ALAN);
        if (settings.voiceEnabled) speak(response, settings.voiceURI);
        updateLayerStatus('L1-INPUT', LayerStatus.IDLE);
        updateLayerStatus('L3-REASONING', LayerStatus.IDLE);
      }, 500);
      return;
    }

    // Layer 3 & 4: Reasoning & Memory
    setSystemState(prev => ({ ...prev, processing: true }));
    updateLayerStatus('L3-REASONING', LayerStatus.PROCESSING);
    updateLayerStatus('L4-MEMORY', LayerStatus.PROCESSING);

    try {
      const memoryContext = await memoryService.retrieveContext(context.normalizedText);
      updateLayerStatus('L4-MEMORY', LayerStatus.ACTIVE);

      const history = messages.slice(-5).map(m => ({
        role: m.sender === MessageSender.USER ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      let prompt = context.normalizedText;
      if (attachments.length > 0) {
        prompt += `\n[System Note: User has attached ${attachments.length} files. Analyze them.]`;
      }

      const rawResponse = await generateAlanResponse(
          prompt, 
          history, 
          settings, 
          attachments, 
          context, 
          reasoningMode,
          memoryContext,
          systemState.world
      );
      
      const { finalResponse, thoughts } = parseModelOutput(rawResponse);
      
      // Meta-Layer: Alignment Check
      const alignment = metaService.validateAlignment(context.normalizedText, finalResponse);
      if (alignment < 50) {
          addMessage("Response halted by Meta-Alignment Protocol.", MessageSender.SYSTEM);
          setSystemState(prev => ({ ...prev, processing: false }));
          return;
      }

      // Layer 6: Action Planning Hook
      let plan: ActionPlan | null = null;
      if (thoughts && thoughts.mode === ReasoningMode.DEEP) {
          plan = parseActionPlan(thoughts);
          if (plan) {
              plan.status = TaskStatus.IN_PROGRESS; 
              setSystemState(prev => ({ ...prev, activePlan: plan }));
              updateLayerStatus('L6-PLANNING', LayerStatus.ACTIVE);
          }
      }

      addMessage(finalResponse, MessageSender.ALAN, undefined, undefined, thoughts, plan);
      memoryService.saveEpisodicMemory('alan', finalResponse);
      
      // Layer 10: Log Interaction Success
      learningService.logInteraction(
          context.intent, 
          context.sentiment, 
          true, 
          plan ? 'COMPLEX_TASK' : 'CHAT_ENGINE'
      );
      
      // Refresh Profile
      learningService.analyzeProfile().then(p => setSystemState(prev => ({ ...prev, learningProfile: p })));

      if (context.intent === UserIntent.COMMAND && /save (blueprint|plan|code)/i.test(context.normalizedText)) {
         await memoryService.saveBlueprint(`Auto-Save ${new Date().toLocaleTimeString()}`, finalResponse);
         addMessage("Blueprint archived to Memory Core.", MessageSender.SYSTEM);
      }

      updateLayerStatus('L3-REASONING', LayerStatus.ACTIVE);

      if (settings.voiceEnabled) {
        setSystemState(prev => ({ ...prev, speaking: true }));
        updateLayerStatus('L9-OUTPUT', LayerStatus.ACTIVE);
        speak(finalResponse, settings.voiceURI, () => {
          setSystemState(prev => ({ ...prev, speaking: false }));
          updateLayerStatus('L9-OUTPUT', LayerStatus.IDLE);
        });
      }

    } catch (error) {
      addMessage("Error in neural processing.", MessageSender.SYSTEM);
      updateLayerStatus('L3-REASONING', LayerStatus.ERROR);
      learningService.logInteraction(context.intent, context.sentiment, false);
    } finally {
      setSystemState(prev => ({ ...prev, processing: false }));
      updateLayerStatus('L3-REASONING', LayerStatus.IDLE);
      updateLayerStatus('L1-INPUT', LayerStatus.IDLE);
      updateLayerStatus('L4-MEMORY', LayerStatus.IDLE);
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
  }, [systemState.listening, systemState.security.isLocked]); 

  return {
    messages,
    systemState,
    processInput,
    processVisualInput,
    toggleListening,
    unlockSystem
  };
};
