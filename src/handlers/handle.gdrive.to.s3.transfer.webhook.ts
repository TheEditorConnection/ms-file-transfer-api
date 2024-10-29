import { Request, Response } from 'express';
import { GDriveToS3TransferCommand } from '../commands/gdrive.to.s3.transfer.command';
import { snakeToCamel } from '../utils/case.converter';
import { IClientPayload } from '../interfaces/client.payload.interface';

export const handleGDriveToS3TransferWebhook = async (req: Request, res: Response): Promise<void> => {
    const payload: IClientPayload = snakeToCamel(req.body) as IClientPayload;
    const { googleDriveFileId, projectId, deliveryItemId } = payload;

    if (!googleDriveFileId || !projectId || !deliveryItemId) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    res.status(200).json({ status: 'received', payload });

    const command = new GDriveToS3TransferCommand(payload);
    await command.execute();
};