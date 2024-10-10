import axios from 'axios';
import { Config } from '../config/config';
import { camelToSnake } from './caseConverter';

export class Notifier {
    public static async notify(payload: any): Promise<void> {
        try {
            const callbackUrl = Config.get('CALLBACK_URL');
            await axios.post(callbackUrl, camelToSnake(payload));
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }
}
