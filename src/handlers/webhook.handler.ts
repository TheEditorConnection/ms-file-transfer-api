import { Request, Response } from 'express';
import { DownloadAndUploadCommand } from '../commands/download.and.upload.command';

export class WebhookHandler {
    public static async handle(req: Request, res: Response): Promise<void> {
        const { googleDriveFileId, projectId, deliveryItemId } = req.body;
        const payload = req.body;
        const authorizationToken = req.headers.authorization ? req.headers.authorization.split(" ")[1] : '';

        if (!googleDriveFileId || !projectId || !deliveryItemId) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        if (!authorizationToken) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        res.status(200).json({ status: 'received', payload });

        const command = new DownloadAndUploadCommand(payload, authorizationToken);
        command.execute();
    }
}
