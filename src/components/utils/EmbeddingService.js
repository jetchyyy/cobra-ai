// src/services/EmbeddingService.js
import { ref, push, get, query, orderByChild } from 'firebase/database';
import { database } from '../../firebase/firebase';

class EmbeddingService {
  constructor() {
    this.similarityThreshold = 0.85; // Adjust this to control cache hit sensitivity
    this.embeddingCache = new Map(); // In-memory cache for faster lookups
  }

  /**
   * Generate a simple embedding using character n-grams and TF-IDF
   * This is a lightweight alternative to calling an embedding API
   */
  generateSimpleEmbedding(text) {
    const cleanText = text.toLowerCase().trim();
    const words = cleanText.split(/\s+/);
    
    // Create a feature vector with different text characteristics
    const features = {
      // Word-based features
      wordCount: words.length,
      avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length,
      uniqueWords: new Set(words).size,
      
      // Character n-grams (trigrams)
      trigrams: this.extractNGrams(cleanText, 3),
      
      // Keyword frequencies (simple TF)
      keywords: this.extractKeywords(words),
    };
    
    return features;
  }

  /**
   * Extract character n-grams from text
   */
  extractNGrams(text, n) {
    const ngrams = {};
    for (let i = 0; i <= text.length - n; i++) {
      const ngram = text.slice(i, i + n);
      ngrams[ngram] = (ngrams[ngram] || 0) + 1;
    }
    return ngrams;
  }

  /**
   * Extract important keywords with their frequencies
   */
  extractKeywords(words) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'what', 'which', 'who', 'when', 'where',
      'why', 'how', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);
    
    const keywords = {};
    words.forEach(word => {
      const clean = word.replace(/[^\w]/g, '');
      if (clean.length > 2 && !stopWords.has(clean)) {
        keywords[clean] = (keywords[clean] || 0) + 1;
      }
    });
    
    return keywords;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1, embedding2) {
    let similarities = [];
    
    // Compare trigram similarity
    const trigramSim = this.compareNGrams(embedding1.trigrams, embedding2.trigrams);
    similarities.push(trigramSim * 0.4); // 40% weight
    
    // Compare keyword similarity
    const keywordSim = this.compareKeywords(embedding1.keywords, embedding2.keywords);
    similarities.push(keywordSim * 0.5); // 50% weight
    
    // Compare structural features
    const structureSim = this.compareStructure(embedding1, embedding2);
    similarities.push(structureSim * 0.1); // 10% weight
    
    return similarities.reduce((a, b) => a + b, 0);
  }

  /**
   * Compare n-gram distributions
   */
  compareNGrams(ngrams1, ngrams2) {
    const allNGrams = new Set([...Object.keys(ngrams1), ...Object.keys(ngrams2)]);
    if (allNGrams.size === 0) return 0;
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    allNGrams.forEach(ngram => {
      const val1 = ngrams1[ngram] || 0;
      const val2 = ngrams2[ngram] || 0;
      dotProduct += val1 * val2;
      mag1 += val1 * val1;
      mag2 += val2 * val2;
    });
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Compare keyword distributions
   */
  compareKeywords(keywords1, keywords2) {
    const allKeywords = new Set([...Object.keys(keywords1), ...Object.keys(keywords2)]);
    if (allKeywords.size === 0) return 0;
    
    let matches = 0;
    allKeywords.forEach(keyword => {
      if (keywords1[keyword] && keywords2[keyword]) {
        matches++;
      }
    });
    
    return matches / allKeywords.size;
  }

  /**
   * Compare structural features
   */
  compareStructure(emb1, emb2) {
    const wordCountDiff = Math.abs(emb1.wordCount - emb2.wordCount);
    const wordCountSim = 1 / (1 + wordCountDiff / 10);
    
    const lengthDiff = Math.abs(emb1.avgWordLength - emb2.avgWordLength);
    const lengthSim = 1 / (1 + lengthDiff);
    
    return (wordCountSim + lengthSim) / 2;
  }

  /**
   * Search for a similar cached response
   */
  async searchSimilarQuery(userId, userMessage, fileContext = null) {
    try {
      // Create a search key based on message and file
      const searchKey = fileContext 
        ? `${userMessage}_${fileContext.name}`
        : userMessage;
      
      // Check in-memory cache first
      if (this.embeddingCache.has(searchKey)) {
        return this.embeddingCache.get(searchKey);
      }

      // Generate embedding for the current query
      const queryEmbedding = this.generateSimpleEmbedding(userMessage);
      
      // Get all cached embeddings for this user
      const embeddingsRef = ref(database, `embeddings/${userId}`);
      const snapshot = await get(embeddingsRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const cachedEmbeddings = snapshot.val();
      let bestMatch = null;
      let bestSimilarity = 0;

      // Search for the most similar query
      Object.entries(cachedEmbeddings).forEach(([key, cache]) => {
        // If file context exists, only match queries with same file
        if (fileContext && cache.fileName !== fileContext.name) {
          return;
        }
        
        const similarity = this.calculateSimilarity(
          queryEmbedding,
          cache.embedding
        );

        if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
          bestSimilarity = similarity;
          bestMatch = {
            response: cache.response,
            similarity,
            originalQuery: cache.query,
            timestamp: cache.timestamp
          };
        }
      });

      // Cache in memory for faster subsequent lookups
      if (bestMatch) {
        this.embeddingCache.set(searchKey, bestMatch);
      }

      return bestMatch;
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
      const embedding = this.generateSimpleEmbedding(userMessage);
      
      const embeddingData = {
        query: userMessage,
        response: aiResponse,
        embedding: embedding,
        fileName: fileContext ? fileContext.name : null,
        fileSize: fileContext ? fileContext.size : null,
        timestamp: Date.now(),
        hitCount: 0 // Track how many times this cache is reused
      };

      const embeddingsRef = ref(database, `embeddings/${userId}`);
      await push(embeddingsRef, embeddingData);

      // Also add to in-memory cache
      const searchKey = fileContext 
        ? `${userMessage}_${fileContext.name}`
        : userMessage;
      this.embeddingCache.set(searchKey, {
        response: aiResponse,
        similarity: 1.0,
        originalQuery: userMessage,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Error storing query response:', error);
      return false;
    }
  }

  /**
   * Increment hit count for cache analytics
   */
  async incrementHitCount(userId, embeddingKey) {
    try {
      const embeddingRef = ref(database, `embeddings/${userId}/${embeddingKey}`);
      const snapshot = await get(embeddingRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        await embeddingRef.set({
          ...data,
          hitCount: (data.hitCount || 0) + 1,
          lastHit: Date.now()
        });
      }
    } catch (error) {
      console.error('Error incrementing hit count:', error);
    }
  }

  /**
   * Clear old cached embeddings (older than 30 days)
   */
  async cleanOldEmbeddings(userId) {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const embeddingsRef = ref(database, `embeddings/${userId}`);
      const snapshot = await get(embeddingsRef);
      
      if (!snapshot.exists()) return;

      const updates = {};
      Object.entries(snapshot.val()).forEach(([key, value]) => {
        if (value.timestamp < thirtyDaysAgo && (value.hitCount || 0) < 2) {
          updates[key] = null; // Mark for deletion
        }
      });

      if (Object.keys(updates).length > 0) {
        await embeddingsRef.update(updates);
      }
    } catch (error) {
      console.error('Error cleaning old embeddings:', error);
    }
  }

  /**
   * Clear in-memory cache
   */
  clearMemoryCache() {
    this.embeddingCache.clear();
  }
}

// Export a singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;