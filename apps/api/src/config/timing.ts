/**
 * 🚀 CENTRALIZED TIMING CONFIGURATION
 * Single source of truth for all timing constants across the application
 */

export const TIMING_CONFIG = {
    // Delivery Job Timing
    DELIVERY_JOB_TIMEOUT: 30000,        // 30 seconds - how long job stays active
    DELIVERY_JOB_TIMER: 30,             // 30 seconds - timer shown to riders
    DELIVERY_JOB_COOLDOWN: 60000,        // 60 seconds - between job processing
    
    // Notification Timing
    NOTIFICATION_DELAY: 1000,           // 1 second - delay before FCM push
    ORDER_NOTIFICATION_DELAY: 2000,     // 2 seconds - delay for order notifications
    
    // Order Processing Timing
    ORDER_BROADCAST_DELAY: 10000,       // 10 seconds - delay between order broadcasts
    ORDER_TIMEOUT_DEFAULT: 5 * 60 * 1000, // 5 minutes - default order timeout
    
    // Database Check Timing
    DATABASE_CHECK_COOLDOWN: 5000,      // 5 seconds - between database checks
    
    // Retry Timing
    MAX_RETRY_ATTEMPTS: 3,              // Maximum retry attempts
    RETRY_COOLDOWN: 5 * 60 * 1000,      // 5 minutes - cooldown after max retries
} as const;

// Helper function to get consistent timing values
export const getTimingConfig = () => TIMING_CONFIG;
