/**
 * 🚀 UNIFIED: Standardized error handling utility
 * Consistent error handling across all components
 */
export class ErrorHandler {
    /**
     * Log error with consistent format
     */
    static logError(error: any, context: string, additionalData?: any): void {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error(`❌ Error in ${context}:`, {
            error: errorMessage,
            stack: errorStack,
            ...additionalData
        });
    }

    /**
     * Handle API errors consistently
     */
    static handleApiError(error: any, context: string): string {
        this.logError(error, context);
        
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        
        if (error.message) {
            return error.message;
        }
        
        return `Failed in ${context}`;
    }

    /**
     * Handle socket errors consistently
     */
    static handleSocketError(error: any, context: string): void {
        this.logError(error, context);
        
        // Socket errors are usually not user-facing
        // Just log them for debugging
    }
}
