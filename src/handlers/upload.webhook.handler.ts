import { Request, Response } from 'express';
import { UploadToGoogleDriveCommand } from '../commands/upload.to.google.drive.command';
import { snakeToCamel } from '../utils/caseConverter';

export class UploadWebhookHandler {
    public static async handle(req: Request, res: Response): Promise<void> {
        const body = req.body;
        const { s3FilePath, googleDriveFolderId } = snakeToCamel(body);
        const authorizationToken = req.headers.authorization ? req.headers.authorization.split(" ")[1] : '';
        const payload = req.body;

        console.log(s3FilePath, googleDriveFolderId);

        if (!s3FilePath || !googleDriveFolderId) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        if (!authorizationToken) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        res.status(200).json({ status: 'received', payload });

        const command = new UploadToGoogleDriveCommand(payload, authorizationToken);
        command.execute();
    }
}
