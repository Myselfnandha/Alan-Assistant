
import { MemoryRecord, Blueprint, InteractionMetric, KnowledgeNode, KnowledgeEdge } from "../types";

const DB_NAME = 'AlanMemoryCore';
const DB_VERSION = 3; // Incremented
const STORES = {
  EPISODIC: 'episodic_memory',
  BLUEPRINTS: 'blueprints',
  PREFS: 'preferences',
  METRICS: 'learning_metrics',
  GRAPH_NODES: 'graph_nodes', // Layer 7
  GRAPH_EDGES: 'graph_edges'  // Layer 7
};

class MemoryService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Memory Core Initialization Failed", event);
        reject("DB_ERROR");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log("Memory Core Online");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORES.EPISODIC)) {
          const episodicStore = db.createObjectStore(STORES.EPISODIC, { keyPath: 'id' });
          episodicStore.createIndex('timestamp', 'timestamp', { unique: false });
          episodicStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        if (!db.objectStoreNames.contains(STORES.BLUEPRINTS)) {
          const bpStore = db.createObjectStore(STORES.BLUEPRINTS, { keyPath: 'id' });
          bpStore.createIndex('category', 'category', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.PREFS)) {
            db.createObjectStore(STORES.PREFS, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORES.METRICS)) {
            db.createObjectStore(STORES.METRICS, { keyPath: 'id' });
        }

        // Layer 7: Knowledge Graph
        if (!db.objectStoreNames.contains(STORES.GRAPH_NODES)) {
            db.createObjectStore(STORES.GRAPH_NODES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.GRAPH_EDGES)) {
            const edgeStore = db.createObjectStore(STORES.GRAPH_EDGES, { keyPath: 'id', autoIncrement: true });
            edgeStore.createIndex('source', 'source', { unique: false });
            edgeStore.createIndex('target', 'target', { unique: false });
        }
      };
    });
  }

  async saveEpisodicMemory(role: 'user' | 'alan', content: string, tags: string[] = []): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.EPISODIC], 'readwrite');
      const store = transaction.objectStore(STORES.EPISODIC);
      
      const record: MemoryRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'EPISODIC',
        content: `[${role.toUpperCase()}] ${content}`,
        tags: tags
      };

      const request = store.add(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async retrieveContext(query: string, limit: number = 5): Promise<string> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.EPISODIC], 'readonly');
      const store = transaction.objectStore(STORES.EPISODIC);
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev');
      const memories: MemoryRecord[] = [];
      const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as MemoryRecord;
          let score = 0;
          if (Date.now() - record.timestamp < 5 * 60 * 1000) score += 2; 
          const contentLower = record.content.toLowerCase();
          keywords.forEach(k => {
            if (contentLower.includes(k)) score += 1;
          });

          if (score > 0 || memories.length < 3) {
            memories.push(record);
          }

          if (memories.length < limit * 2) {
            cursor.continue();
          } else {
             const contextString = memories
                .slice(0, limit)
                .reverse()
                .map(m => m.content)
                .join('\n');
             resolve(contextString);
          }
        } else {
           const contextString = memories
                .reverse()
                .map(m => m.content)
                .join('\n');
           resolve(contextString);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveBlueprint(title: string, content: string, category: string = 'general'): Promise<void> {
     if (!this.db) await this.init();
     return new Promise((resolve, reject) => {
       const transaction = this.db!.transaction([STORES.BLUEPRINTS], 'readwrite');
       const store = transaction.objectStore(STORES.BLUEPRINTS);
       
       const blueprint: Blueprint = {
         id: crypto.randomUUID(),
         title,
         content,
         category,
         created: Date.now(),
         updated: Date.now()
       };
 
       const request = store.put(blueprint);
       request.onsuccess = () => resolve();
       request.onerror = () => reject(request.error);
     });
  }

  async getAllBlueprints(): Promise<Blueprint[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORES.BLUEPRINTS], 'readonly');
        const store = transaction.objectStore(STORES.BLUEPRINTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
  }

  async saveMetric(metric: InteractionMetric): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORES.METRICS], 'readwrite');
        const store = transaction.objectStore(STORES.METRICS);
        store.put(metric);
        transaction.oncomplete = () => resolve();
    });
  }

  async getAllMetrics(): Promise<InteractionMetric[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORES.METRICS], 'readonly');
        const store = transaction.objectStore(STORES.METRICS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
    });
  }

  // LAYER 7: Knowledge Graph Methods
  async addKnowledgeNode(node: KnowledgeNode): Promise<void> {
      if (!this.db) await this.init();
      return new Promise((resolve) => {
          const tx = this.db!.transaction([STORES.GRAPH_NODES], 'readwrite');
          tx.objectStore(STORES.GRAPH_NODES).put(node);
          tx.oncomplete = () => resolve();
      });
  }

  async getKnowledgeGraph(): Promise<{nodes: KnowledgeNode[], edges: KnowledgeEdge[]}> {
      if (!this.db) await this.init();
      const nodes = await new Promise<KnowledgeNode[]>(r => {
          const req = this.db!.transaction(STORES.GRAPH_NODES).objectStore(STORES.GRAPH_NODES).getAll();
          req.onsuccess = () => r(req.result);
      });
      const edges = await new Promise<KnowledgeEdge[]>(r => {
          const req = this.db!.transaction(STORES.GRAPH_EDGES).objectStore(STORES.GRAPH_EDGES).getAll();
          req.onsuccess = () => r(req.result);
      });
      return { nodes, edges };
  }
}

export const memoryService = new MemoryService();
