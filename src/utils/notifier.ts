import axios from 'axios';

export class Notifier {
    public static async notify(url: string, payload: any): Promise<void> {
        try {
            await axios.post(url, payload);
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }
}
