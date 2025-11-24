// Simple browser-based implementation of Layer 1 (Input) and Layer 9 (Output)

export const speak = (text: string, onEnd?: () => void) => {
  if (!window.speechSynthesis) return;

  // Cancel existing speech
  window.speechSynthesis.cancel();

  // Strip Markdown/Technical jargon for cleaner speech
  const speechText = text
    .replace(/\[.*?\]/g, '') // Remove [TAGS]
    .replace(/\*/g, '') // Remove bold/italic markers
    .replace(/http\S+/g, 'link');

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 1.05; // Slightly faster
  utterance.pitch = 0.95; // Slightly deeper
  utterance.volume = 1.0;

  // Try to find a good British male voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Google UK English Male') || 
    v.name.includes('Daniel') ||
    (v.name.includes('English') && v.name.includes('Male'))
  );
  
  if (preferredVoice) utterance.voice = preferredVoice;

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