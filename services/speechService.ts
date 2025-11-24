
// Simple browser-based implementation of Layer 1 (Input) and Layer 9 (Output)

export const getVoices = (): SpeechSynthesisVoice[] => {
    return window.speechSynthesis.getVoices();
};

export const speak = (text: string, voiceURI?: string, onEnd?: () => void) => {
  if (!window.speechSynthesis) return;

  // Cancel existing speech
  window.speechSynthesis.cancel();

  // Layer 9 Output Filter: Clean text for TTS (Natural Voice)
  // 1. Remove Thought Process Tags
  let speechText = text.replace(/<thought_process>[\s\S]*?<\/thought_process>/g, '');
  
  // 2. Remove Markdown Tables (TTS shouldn't read "| Column | Column |")
  speechText = speechText.replace(/\|.*?\|/g, '');
  
  // 3. Remove Code Blocks
  speechText = speechText.replace(/```[\s\S]*?```/g, 'Code block generated.');
  
  // 4. Remove Technical Tags/Brackets
  speechText = speechText.replace(/\[.*?\]/g, ''); 
  speechText = speechText.replace(/<.*?>/g, '');
  
  // 5. Clean Formatting
  speechText = speechText
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '')   // Remove italics
    .replace(/http\S+/g, 'link')
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  if (!speechText) return;

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 1.05; // Slightly faster for efficiency
  utterance.pitch = 0.95; // Slightly deeper/calmer
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  
  if (voiceURI) {
      const selected = voices.find(v => v.voiceURI === voiceURI);
      if (selected) utterance.voice = selected;
  } else {
      // Try to find a good British male voice (Jarvis style)
      const preferredVoice = voices.find(v => 
        v.name.includes('Google UK English Male') || 
        v.name.includes('Daniel') ||
        (v.name.includes('English') && v.name.includes('Male'))
      );
      if (preferredVoice) utterance.voice = preferredVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export class VoiceListener {
  recognition: any;
  isListening: boolean = false;

  constructor(onResult: (text: string) => void, onEnd: () => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };
      
      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        this.isListening = false;
        onEnd();
      };
    }
  }

  start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.error("Start error", e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
