import { Request, Response } from 'express';
import { UploadToGoogleDriveCommand } from '../commands/upload.to.google.drive.command';

export class UploadWebhookHandler {
    public static async handle(req: Request, res: Response): Promise<void> {
        const { s3FilePath, googleDriveFolderId } = req.body;
        const payload = req.body;

        console.log(s3FilePath, googleDriveFolderId);

        if (!s3FilePath || !googleDriveFolderId) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        res.status(200).json({ status: 'received', payload });

        const command = new UploadToGoogleDriveCommand(payload);
        command.execute();
    }
}
