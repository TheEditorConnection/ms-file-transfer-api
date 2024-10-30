export class NotificationError extends Error {
    public url: string;
    public payload: object;
    public originalError: Error;

    /**
     * Constructs a NotificationError with additional details for better error tracking.
     * 
     * @param url - The URL to which the notification was being sent.
     * @param payload - The payload that was attempted to be sent in the notification.
     * @param originalError - The original Error object that caused this notification error.
     */
    constructor(url: string, payload: object, originalError: Error) {
        super(`Notification Error: Failed to send notification to ${url} - ${originalError.message}`);
        this.name = 'NotificationError';
        this.url = url;
        this.payload = payload;
        this.originalError = originalError;

        // Append the original error's stack trace to this error's stack for comprehensive traceability
        if (originalError.stack) {
            this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
        }
    }
}
