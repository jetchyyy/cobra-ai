// src/services/GuidelinesService.js - Using Gemini Embedding API
import { ref, get, set } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';

class GuidelinesService {
  constructor() {
    this.similarityThreshold = 0.70; // Higher threshold for Gemini embeddings
    
    this.guidelinesIndex = {
      vectors: [],
      metadata: [],
      ids: []
    };
    this.indexLoaded = false;
    this.isBuilding = false;
    
    // Initialize Gemini AI
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  /**
   * Generate embedding using Gemini API
   */
  async generateEmbedding(text) {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
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
   * Build guidelines index with Gemini embeddings
   */
  async buildGuidelinesIndex(forceRebuild = false) {
    if (this.indexLoaded && !forceRebuild) {
      console.log('Guidelines index already loaded');
      return true;
    }
    
    if (this.isBuilding) {
      console.log('Index is already being built');
      return false;
    }

    this.isBuilding = true;
    console.log('🔨 Building guidelines index with Gemini embeddings...');

    try {
      // Fetch guidelines
      const guidelinesRef = ref(database, 'guidelines');
      const snapshot = await get(guidelinesRef);

      if (!snapshot.exists()) {
        console.warn('⚠️ No guidelines found in database');
        this.indexLoaded = true;
        this.isBuilding = false;
        return false;
      }

      const guidelines = snapshot.val();
      console.log(`📚 Found ${Object.keys(guidelines).length} guidelines`);

      // Check for cached embeddings
      const embeddingsRef = ref(database, 'guideline_embeddings');
      const embeddingsSnapshot = await get(embeddingsRef);
      const existingEmbeddings = embeddingsSnapshot.exists() ? embeddingsSnapshot.val() : {};

      // Reset index
      this.guidelinesIndex = {
        vectors: [],
        metadata: [],
        ids: []
      };

      const updates = {};
      let apiCallCount = 0;

      for (const [id, guideline] of Object.entries(guidelines)) {
        console.log(`Processing: ${guideline.title}`);

        // Check if embedding exists and guideline hasn't been updated
        let embedding = null;
        const existingEmbed = existingEmbeddings[id];
        
        if (existingEmbed && 
            existingEmbed.guidelineUpdatedAt === guideline.updatedAt &&
            !forceRebuild) {
          // Use cached embedding
          embedding = existingEmbed.embedding;
          console.log('  ✓ Using cached embedding');
        } else {
          // Generate new embedding
          console.log('  🔄 Generating new embedding...');
          const textToEmbed = `${guideline.title}\n${guideline.content}\nKeywords: ${guideline.keywords.join(', ')}`;
          
          try {
            embedding = await this.generateEmbedding(textToEmbed);
            apiCallCount++;
            
            updates[id] = {
              embedding,
              guidelineId: id,
              guidelineUpdatedAt: guideline.updatedAt,
              lastEmbedded: Date.now()
            };
            
            console.log('  ✅ Embedding generated');
          } catch (error) {
            console.error(`  ❌ Failed to generate embedding for "${guideline.title}":`, error);
            continue; // Skip this guideline
          }
        }

        // Add to in-memory index
        if (embedding) {
          this.guidelinesIndex.vectors.push(embedding);
          this.guidelinesIndex.metadata.push({
            id,
            title: guideline.title,
            category: guideline.category,
            content: guideline.content,
            keywords: guideline.keywords
          });
          this.guidelinesIndex.ids.push(id);
        }
      }

      // Save new embeddings to Firebase
      if (Object.keys(updates).length > 0) {
        console.log(`💾 Saving ${Object.keys(updates).length} new embeddings...`);
        await set(embeddingsRef, { ...existingEmbeddings, ...updates });
      }

      this.indexLoaded = true;
      console.log(`✅ Guidelines index built successfully!`);
      console.log(`   - Total guidelines: ${this.guidelinesIndex.vectors.length}`);
      console.log(`   - API calls made: ${apiCallCount}`);
      console.log(`   - Cached embeddings used: ${this.guidelinesIndex.vectors.length - apiCallCount}`);
      
      return true;

    } catch (error) {
      console.error('❌ Error building guidelines index:', error);
      this.indexLoaded = false;
      return false;
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Search for relevant guidelines
   */
  async searchGuidelines(userQuery, topK = 3) {
    try {
      if (!userQuery || typeof userQuery !== 'string') {
        return [];
      }

      // Ensure index is loaded
      if (!this.indexLoaded) {
        console.log('Index not loaded, building now...');
        const success = await this.buildGuidelinesIndex();
        if (!success) {
          console.error('Failed to build index');
          return [];
        }
      }

      if (this.guidelinesIndex.vectors.length === 0) {
        console.warn('No guidelines available');
        return [];
      }

      console.log(`🔍 Searching for: "${userQuery}"`);

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(userQuery);

      // Calculate similarities
      const similarities = [];
      for (let i = 0; i < this.guidelinesIndex.vectors.length; i++) {
        const similarity = this.cosineSimilarity(queryEmbedding, this.guidelinesIndex.vectors[i]);
        
        console.log(`  - "${this.guidelinesIndex.metadata[i].title}": ${(similarity * 100).toFixed(1)}%`);
        
        if (similarity >= this.similarityThreshold) {
          similarities.push({
            similarity,
            guideline: this.guidelinesIndex.metadata[i]
          });
        }
      }

      // Sort by similarity
      similarities.sort((a, b) => b.similarity - a.similarity);
      const results = similarities.slice(0, topK);

      if (results.length > 0) {
        console.log(`✅ Found ${results.length} matching guidelines`);
        console.log(`   Best match: "${results[0].guideline.title}" (${(results[0].similarity * 100).toFixed(1)}%)`);
      } else {
        console.log(`⚠️ No guidelines matched (all below ${(this.similarityThreshold * 100).toFixed(0)}% threshold)`);
      }

      return results;

    } catch (error) {
      console.error('❌ Error searching guidelines:', error);
      return [];
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      loaded: this.indexLoaded,
      building: this.isBuilding,
      guidelinesCount: this.guidelinesIndex.vectors.length,
      threshold: this.similarityThreshold,
      model: 'text-embedding-004'
    };
  }

  /**
   * Clear index
   */
  clearIndex() {
    this.guidelinesIndex = {
      vectors: [],
      metadata: [],
      ids: []
    };
    this.indexLoaded = false;
    console.log('🗑️ Index cleared');
  }

  /**
   * Force rebuild index
   */
  async rebuildIndex() {
    this.clearIndex();
    return await this.buildGuidelinesIndex(true);
  }

  /**
   * Delete cached embedding for a guideline
   */
  async deleteCachedEmbedding(guidelineId) {
    try {
      const embeddingRef = ref(database, `guideline_embeddings/${guidelineId}`);
      await set(embeddingRef, null);
      console.log(`🗑️ Deleted cached embedding for guideline: ${guidelineId}`);
    } catch (error) {
      console.error('Error deleting cached embedding:', error);
    }
  }

  /**
   * Get embedding cache stats
   */
  async getCacheStats() {
    try {
      const embeddingsRef = ref(database, 'guideline_embeddings');
      const snapshot = await get(embeddingsRef);
      
      if (!snapshot.exists()) {
        return { total: 0, size: 0 };
      }

      const embeddings = snapshot.val();
      const total = Object.keys(embeddings).length;
      
      return {
        total,
        embeddings: Object.entries(embeddings).map(([id, data]) => ({
          id,
          lastEmbedded: data.lastEmbedded,
          vectorSize: data.embedding?.length || 0
        }))
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { total: 0, size: 0 };
    }
  }
}

// Export singleton
export const guidelinesService = new GuidelinesService();
export default guidelinesService;