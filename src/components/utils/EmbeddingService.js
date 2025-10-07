// src/services/EmbeddingService.js - Using Gemini Embedding API with FAISS-like search
import { ref, push, get, set, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';

class EmbeddingService {
  constructor() {
    this.similarityThreshold = 0.75; // Cosine similarity threshold
    this.embeddingCache = new Map(); // In-memory cache for faster lookups
    this.vectorCache = new Map(); // Cache for embedding vectors
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_FIREBASE_API_KEY);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    // FAISS-like index structure
    this.index = {
      vectors: [],
      metadata: [],
      ids: []
    };
    this.indexLoaded = false;
  }

  /**
   * Generate embedding vector using Gemini Embedding API
   */
  async generateEmbedding(text) {
    try {
      // Check if we already have this embedding cached
      const cacheKey = this.hashText(text);
      if (this.vectorCache.has(cacheKey)) {
        return this.vectorCache.get(cacheKey);
      }

      // Generate embedding using Gemini
      const result = await this.embeddingModel.embedContent(text);
      const embedding = result.embedding.values;

      // Cache the embedding
      this.vectorCache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback to simple embedding if API fails
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Simple hash function for cache keys
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Fallback: Generate simple embedding (TF-IDF style)
   */
  generateSimpleEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const vocab = new Set(words);
    const vector = new Array(300).fill(0);
    
    // Simple word hashing into fixed-size vector
    words.forEach((word, idx) => {
      const hash = this.hashText(word);
      const index = Math.abs(hash) % 300;
      vector[index] += 1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  /**
   * Calculate cosine similarity between two vectors (FAISS uses this)
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      console.error('Vector dimensions do not match');
      return 0;
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Load FAISS-like index from Firebase
   */
  async loadIndex(userId) {
    if (this.indexLoaded) return;

    try {
      const embeddingsRef = ref(database, `embeddings/${userId}`);
      const snapshot = await get(embeddingsRef);

      if (!snapshot.exists()) {
        this.indexLoaded = true;
        return;
      }

      const embeddings = snapshot.val();
      
      // Build index structure
      this.index.vectors = [];
      this.index.metadata = [];
      this.index.ids = [];

      Object.entries(embeddings).forEach(([id, data]) => {
        if (data.embedding && Array.isArray(data.embedding)) {
          this.index.vectors.push(data.embedding);
          this.index.metadata.push({
            query: data.query,
            response: data.response,
            fileName: data.fileName,
            fileSize: data.fileSize,
            timestamp: data.timestamp,
            hitCount: data.hitCount || 0
          });
          this.index.ids.push(id);
        }
      });

      this.indexLoaded = true;
      console.log(`Loaded ${this.index.vectors.length} embeddings into index`);
    } catch (error) {
      console.error('Error loading index:', error);
      this.indexLoaded = true;
    }
  }

  /**
   * FAISS-like search: Find k nearest neighbors
   */
  async searchKNN(queryVector, k = 5, fileContext = null) {
    const similarities = [];

    for (let i = 0; i < this.index.vectors.length; i++) {
      const metadata = this.index.metadata[i];
      
      // Filter by file if context provided
      if (fileContext && metadata.fileName !== fileContext.name) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryVector, this.index.vectors[i]);
      
      if (similarity >= this.similarityThreshold) {
        similarities.push({
          similarity,
          metadata,
          id: this.index.ids[i],
          index: i
        });
      }
    }

    // Sort by similarity (descending) and return top k
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, k);
  }

  /**
   * Search for similar queries using FAISS-like approach
   */
  async searchSimilarQuery(userId, userMessage, fileContext = null) {
    try {
      // Load index if not already loaded
      await this.loadIndex(userId);

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(userMessage);

      // Search for similar vectors
      const results = await this.searchKNN(queryEmbedding, 1, fileContext);

      if (results.length === 0) {
        return null;
      }

      const bestMatch = results[0];
      
      // Return the best match
      return {
        response: bestMatch.metadata.response,
        similarity: bestMatch.similarity,
        originalQuery: bestMatch.metadata.query,
        timestamp: bestMatch.metadata.timestamp,
        embeddingId: bestMatch.id
      };
    } catch (error) {
      console.error('Error searching similar queries:', error);
      return null;
    }
  }

  /**
   * Store a new query-response pair with its embedding
   */
  async storeQueryResponse(userId, userMessage, aiResponse, fileContext = null) {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(userMessage);
      
      const embeddingData = {
        query: userMessage,
        response: aiResponse,
        embedding: embedding,
        fileName: fileContext ? fileContext.name : null,
        fileSize: fileContext ? fileContext.size : null,
        timestamp: Date.now(),
        hitCount: 0
      };

      // Store in Firebase
      const embeddingsRef = ref(database, `embeddings/${userId}`);
      const newRef = await push(embeddingsRef, embeddingData);

      // Add to in-memory index
      this.index.vectors.push(embedding);
      this.index.metadata.push({
        query: userMessage,
        response: aiResponse,
        fileName: fileContext ? fileContext.name : null,
        fileSize: fileContext ? fileContext.size : null,
        timestamp: Date.now(),
        hitCount: 0
      });
      this.index.ids.push(newRef.key);

      console.log('Stored new embedding. Index size:', this.index.vectors.length);
      return true;
    } catch (error) {
      console.error('Error storing query response:', error);
      return false;
    }
  }

  /**
   * Increment hit count for cache analytics
   */
  async incrementHitCount(userId, embeddingId) {
    try {
      const embeddingRef = ref(database, `embeddings/${userId}/${embeddingId}`);
      const snapshot = await get(embeddingRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(embeddingRef, {
          ...data,
          hitCount: (data.hitCount || 0) + 1,
          lastHit: Date.now()
        });

        // Update in-memory index
        const idx = this.index.ids.indexOf(embeddingId);
        if (idx !== -1) {
          this.index.metadata[idx].hitCount = (this.index.metadata[idx].hitCount || 0) + 1;
        }
      }
    } catch (error) {
      console.error('Error incrementing hit count:', error);
    }
  }

  /**
   * Clean old embeddings (older than 30 days with low usage)
   */
  async cleanOldEmbeddings(userId) {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const embeddingsRef = ref(database, `embeddings/${userId}`);
      const snapshot = await get(embeddingsRef);
      
      if (!snapshot.exists()) return;

      const deletionPromises = [];
      Object.entries(snapshot.val()).forEach(([key, value]) => {
        if (value.timestamp < thirtyDaysAgo && (value.hitCount || 0) < 3) {
          deletionPromises.push(
            remove(ref(database, `embeddings/${userId}/${key}`))
          );
        }
      });

      if (deletionPromises.length > 0) {
        await Promise.all(deletionPromises);
        console.log(`Cleaned ${deletionPromises.length} old embeddings`);
        
        // Reload index after cleanup
        this.indexLoaded = false;
        await this.loadIndex(userId);
      }
    } catch (error) {
      console.error('Error cleaning old embeddings:', error);
    }
  }

  /**
   * Get index statistics
   */
  getIndexStats() {
    return {
      totalVectors: this.index.vectors.length,
      memorySize: this.calculateIndexSize(),
      cacheSize: this.embeddingCache.size
    };
  }

  /**
   * Calculate approximate index size in MB
   */
  calculateIndexSize() {
    const vectorSize = this.index.vectors.reduce((total, vec) => {
      return total + vec.length * 8; // 8 bytes per float64
    }, 0);
    return (vectorSize / (1024 * 1024)).toFixed(2);
  }

  /**
   * Clear in-memory cache and index
   */
  clearCache() {
    this.embeddingCache.clear();
    this.vectorCache.clear();
    this.index = {
      vectors: [],
      metadata: [],
      ids: []
    };
    this.indexLoaded = false;
  }

  /**
   * Rebuild index (useful after bulk operations)
   */
  async rebuildIndex(userId) {
    this.clearCache();
    await this.loadIndex(userId);
  }
}

// Export a singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;