// messageLimitManager.js
// Manages message limits for users with 5-hour reset using Firebase Realtime Database

import { ref, get, set, update } from 'firebase/database';
import { database } from '../../firebase/firebase';

const MESSAGE_LIMIT = 5;
const RESET_HOURS = 5; // Reset after 5 hours

/**
 * Get message limit data for a user from Firebase Realtime Database
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - { count, resetTime, canSend, remaining }
 */
export const getMessageLimitData = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const limitRef = ref(database, `messageLimits/${userId}`);
    const snapshot = await get(limitRef);
    const data = snapshot.val() || {};
    
    const now = new Date();
    const resetTime = data.resetTime ? new Date(data.resetTime) : null;
    
    // Check if we need to reset the count
    if (!resetTime || now >= resetTime) {
      // Reset the count and set new reset time
      const newResetTime = getNextResetTime();
      const newData = {
        count: 0,
        resetTime: newResetTime.toISOString(),
        lastUpdated: now.toISOString()
      };
      
      await set(limitRef, newData);
      
      return {
        count: 0,
        resetTime: newResetTime,
        canSend: true,
        remaining: MESSAGE_LIMIT
      };
    }
    
    // Return existing data
    const count = data.count || 0;
    return {
      count,
      resetTime,
      canSend: count < MESSAGE_LIMIT,
      remaining: Math.max(0, MESSAGE_LIMIT - count)
    };
  } catch (error) {
    console.error('Error getting message limit data:', error);
    // Fallback to allow sending if database fails
    return {
      count: 0,
      resetTime: getNextResetTime(),
      canSend: true,
      remaining: MESSAGE_LIMIT,
      error: true
    };
  }
};

/**
 * Calculate the next reset time (5 hours from now)
 * @returns {Date} - Next reset time
 */
const getNextResetTime = () => {
  const now = new Date();
  const resetTime = new Date(now.getTime() + (RESET_HOURS * 60 * 60 * 1000));
  return resetTime;
};

/**
 * Increment the message count for a user in Firebase
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Updated limit data
 */
export const incrementMessageCount = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const currentData = await getMessageLimitData(userId);
    
    if (!currentData.canSend) {
      throw new Error('Message limit reached');
    }
    
    const limitRef = ref(database, `messageLimits/${userId}`);
    const newCount = currentData.count + 1;
    
    await update(limitRef, {
      count: newCount,
      lastUpdated: new Date().toISOString()
    });
    
    return {
      count: newCount,
      resetTime: currentData.resetTime,
      canSend: newCount < MESSAGE_LIMIT,
      remaining: Math.max(0, MESSAGE_LIMIT - newCount)
    };
  } catch (error) {
    console.error('Error incrementing message count:', error);
    throw error;
  }
};

/**
 * Format time remaining until reset
 * @param {Date} resetTime - The reset time
 * @returns {string} - Formatted time string
 */
export const getTimeUntilReset = (resetTime) => {
  const now = new Date();
  const diff = resetTime - now;
  
  if (diff <= 0) return 'Soon';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Reset message count manually (for admin/testing)
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export const resetMessageCount = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const limitRef = ref(database, `messageLimits/${userId}`);
    const newResetTime = getNextResetTime();
    
    await set(limitRef, {
      count: 0,
      resetTime: newResetTime.toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    console.log('Message count reset successfully');
  } catch (error) {
    console.error('Error resetting message count:', error);
    throw error;
  }
};

/**
 * Get message limit statistics for all users (admin function)
 * @returns {Promise<Object>} - All users' message limit data
 */
export const getAllMessageLimits = async () => {
  try {
    const limitsRef = ref(database, 'messageLimits');
    const snapshot = await get(limitsRef);
    return snapshot.val() || {};
  } catch (error) {
    console.error('Error getting all message limits:', error);
    throw error;
  }
};

/**
 * Debug function - Check user's current status with detailed info
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export const debugMessageLimit = async (userId) => {
  if (!userId) {
    console.error('❌ No userId provided');
    return;
  }

  try {
    const limitRef = ref(database, `messageLimits/${userId}`);
    const snapshot = await get(limitRef);
    const rawData = snapshot.val();
    
    console.log('🔍 Debug Message Limit for:', userId);
    console.log('📊 Raw Database Data:', rawData);
    
    if (!rawData) {
      console.log('✅ No limit data found - user can send messages');
      return;
    }

    const now = new Date();
    const resetTime = new Date(rawData.resetTime);
    const needsReset = now >= resetTime;

    console.log('⏰ Current Time:', now.toISOString());
    console.log('🔄 Reset Time:', rawData.resetTime);
    console.log('📈 Current Count:', rawData.count);
    console.log('🚦 Needs Reset:', needsReset);
    console.log('✨ Can Send:', rawData.count < MESSAGE_LIMIT && !needsReset);
    console.log('⏳ Time Until Reset:', getTimeUntilReset(resetTime));

    if (needsReset) {
      console.log('⚠️ This user\'s limit should auto-reset on next check');
    }
  } catch (error) {
    console.error('❌ Error debugging message limit:', error);
  }
};