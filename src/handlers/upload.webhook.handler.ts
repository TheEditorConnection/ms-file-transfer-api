import { Request, Response } from 'express';
import { UploadToGoogleDriveCommand } from '../commands/upload.to.google.drive.command';
import { snakeToCamel } from '../utils/case.converter';
import { IClientPayload } from '../interfaces/client.payload.interface';

export const handleUploadWebhook = async (req: Request, res: Response): Promise<void> => {
    const payload = snakeToCamel(req.body) as IClientPayload;
    const { s3FilePath, googleDriveFolderId } = payload;

    if (!s3FilePath || !googleDriveFolderId) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    res.status(200).json({ status: 'received', payload });

    const command = new UploadToGoogleDriveCommand(payload);
    await command.execute();
};