import { Request, Response } from 'express';
import { DownloadAndUploadCommand } from '../commands/download.and.upload.command';

export class WebhookHandler {
    public static async handle(req: Request, res: Response): Promise<void> {
        const { googleDriveFileId, projectId, deliveryItemId, callbackUrl } = req.body;

        if (!googleDriveFileId || !callbackUrl) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        res.status(200).json({ status: 'received' });

        const command = new DownloadAndUploadCommand(googleDriveFileId, projectId, deliveryItemId, callbackUrl);
        command.execute();
    }
}
