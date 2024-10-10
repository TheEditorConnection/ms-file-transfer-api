import axios from 'axios';
import { camelToSnake } from './caseConverter';
import { Logger } from './logger';

export class Notifier {
    public static async notify(url: string, token: string, payload: any): Promise<void> {
        try {
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
            await axios.post(url, camelToSnake(payload), { headers });
            Logger.info(`Notification sent: ${JSON.stringify(payload)}`);
        } catch (error) {
            Logger.error(`Error sending notification: ${error}`);
        }
    }
}
