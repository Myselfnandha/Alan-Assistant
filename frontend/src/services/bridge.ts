export type BridgeMessage = {
    type: 'response' | 'wake_word' | 'status';
    text?: string;
    payload?: any;
};

class AlanBridge {
    private ws: WebSocket | null = null;
    private url: string = "ws://localhost:8000/ws"; // Change localhost to PC IP for Android
    private listeners: ((msg: BridgeMessage) => void)[] = [];

    connect(ip?: string) {
        if(ip) this.url = `ws://${ip}:8000/ws`;
        
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log("[Bridge] Connected to ALAN Core");
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.notify(data);
        };

        this.ws.onerror = (e) => console.error("[Bridge] Error", e);
    }

    sendText(text: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'text_input', payload: text }));
        } else {
            console.error("[Bridge] Not connected");
        }
    }

    subscribe(callback: (msg: BridgeMessage) => void) {
        this.listeners.push(callback);
    }

    private notify(msg: BridgeMessage) {
        this.listeners.forEach(l => l(msg));
    }
}

export const alanBridge = new AlanBridge();