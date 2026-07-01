// Semantic Search Engine - Browser-based embedding + cosine similarity
// Uses @huggingface/transformers for in-browser inference

interface EmbeddingEntry {
  notebookId: string;
  text: string;
  embedding: number[];
  updatedAt: number;
}

const DB_NAME = 'kawaiinote-embeddings';
const STORE_NAME = 'embeddings';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'notebookId' });
      }
    };
  });
}

async function saveEmbedding(entry: EmbeddingEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllEmbeddings(): Promise<EmbeddingEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SearchResult {
  notebookId: string;
  score: number;
  text: string;
}

type PipelineType = any;
let pipeline: PipelineType | null = null;
let isLoading = false;
let loadingCallbacks: Array<(p: PipelineType) => void> = [];

async function getEmbeddingPipeline(): Promise<PipelineType> {
  if (pipeline) return pipeline;
  
  if (isLoading) {
    return new Promise((resolve) => {
      loadingCallbacks.push(resolve);
    });
  }
  
  isLoading = true;
  
  try {
    const { pipeline: createPipeline } = await import('@huggingface/transformers');
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      // @ts-ignore - transformers.js options
      dtype: 'fp32'
    });
    
    // Notify all waiting callbacks
    loadingCallbacks.forEach(cb => cb(pipeline));
    loadingCallbacks = [];
    
    return pipeline;
  } catch (err) {
    isLoading = false;
    throw err;
  }
}

async function embed(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export class SemanticSearchEngine {
  private static _isModelLoaded = false;
  private static _isModelLoading = false;

  static get isModelLoaded() { return this._isModelLoaded; }
  static get isModelLoading() { return this._isModelLoading; }

  /**
   * Pre-load the embedding model (call on app start or first search)
   */
  static async loadModel(onProgress?: (msg: string) => void): Promise<void> {
    if (this._isModelLoaded) return;
    this._isModelLoading = true;
    onProgress?.('Embedding modeli yükleniyor...');
    
    try {
      await getEmbeddingPipeline();
      this._isModelLoaded = true;
      onProgress?.('Model hazır!');
    } catch (err) {
      onProgress?.('Model yüklenemedi.');
      throw err;
    } finally {
      this._isModelLoading = false;
    }
  }

  /**
   * Index a notebook's text content for future semantic search
   */
  static async indexNotebook(notebookId: string, textContent: string): Promise<void> {
    if (!textContent || textContent.trim().length < 5) return;
    
    const embedding = await embed(textContent);
    await saveEmbedding({
      notebookId,
      text: textContent.substring(0, 500), // store first 500 chars for preview
      embedding,
      updatedAt: Date.now()
    });
  }

  /**
   * Search across all indexed notebooks by semantic similarity
   */
  static async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];
    
    const queryEmbedding = await embed(query);
    const allEntries = await getAllEmbeddings();
    
    if (allEntries.length === 0) return [];
    
    const results: SearchResult[] = allEntries.map(entry => ({
      notebookId: entry.notebookId,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
      text: entry.text
    }));
    
    // Sort by similarity score descending and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK).filter(r => r.score > 0.3); // threshold: 0.3
  }

  /**
   * Clear all indexed embeddings
   */
  static async clearIndex(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
