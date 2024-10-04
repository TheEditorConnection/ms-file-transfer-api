import axios from 'axios';
import { Config } from '../config/config';

export class Notifier {
    public static async notify(payload: any): Promise<void> {
        try {
            const callbackUrl = Config.get('CALLBACK_URL');
            await axios.post(callbackUrl, payload);
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }
}
