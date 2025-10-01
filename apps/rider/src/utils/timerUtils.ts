import { UnifiedOrder } from '../types/order';

/**
 * 🚀 UNIFIED: Single timer calculation utility
 * Consistent timer calculations across all components
 */
export class TimerUtils {
    /**
     * Calculate remaining time for a delivery job
     */
    static calculateTimeLeft(job: UnifiedOrder): number {
        if (!job.expiresIn || !job.createdAt) return 0;
        
        // Calculate elapsed time since job was created
        const now = Date.now();
        const createdAt = new Date(job.createdAt).getTime();
        const elapsedSeconds = Math.floor((now - createdAt) / 1000);
        
        // Return remaining time
        return Math.max(0, job.expiresIn - elapsedSeconds);
    }

    /**
     * Format time remaining as human-readable string
     */
    static formatTimeLeft(timeLeft: number): string {
        if (timeLeft <= 0) return 'Expired';
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s left`;
        } else {
            return `${seconds}s left`;
        }
    }

    /**
     * Check if job is expired
     */
    static isExpired(job: UnifiedOrder): boolean {
        return this.calculateTimeLeft(job) <= 0;
    }

    /**
     * Check if job is expiring soon (less than 10 seconds)
     */
    static isExpiringSoon(job: UnifiedOrder): boolean {
        return this.calculateTimeLeft(job) <= 10;
    }
}
