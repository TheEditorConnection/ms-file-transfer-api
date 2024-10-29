import axios from 'axios';
import { camelToSnake } from './case.converter';
import { Logger } from './logger';
import { IClientPayload } from '../interfaces/client.payload.interface';

export const notify = async (url: string, token: string, payload: IClientPayload): Promise<void> => {
    try {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        await axios.post(url, camelToSnake(payload), { headers });
        Logger.info(`Notification sent: ${JSON.stringify(payload)}`);
    } catch (error) {
        Logger.error(`Error sending notification: ${error}`);
    }
};