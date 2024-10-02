import { Request, Response } from 'express';
import { UploadToGoogleDriveCommand } from '../commands/upload.to.google.drive.command';

export class UploadWebhookHandler {
    public static async handle(req: Request, res: Response): Promise<void> {
        const { s3FilePath, googleDriveFolderId, callbackUrl } = req.body;

        console.log(s3FilePath, googleDriveFolderId, callbackUrl);

        if (!s3FilePath || !googleDriveFolderId || !callbackUrl) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        res.status(200).json({ status: 'received' });

        const command = new UploadToGoogleDriveCommand(s3FilePath, googleDriveFolderId, callbackUrl);
        command.execute();
    }
}
