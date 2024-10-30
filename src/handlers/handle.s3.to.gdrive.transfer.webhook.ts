import { Request, Response } from "express";
import { S3ToGDriveTransferCommand } from "../commands/s3.to.gdrive.transfer.command";
import { camelToSnake, snakeToCamel } from "../utils/case.converter";
import { IClientPayload } from "../interfaces/client.payload.interface";

export const handleS3ToGDriveTransferWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const payload = snakeToCamel(req.body) as IClientPayload;
  const { s3FilePath, googleDriveFolderId } = payload;

  if (!s3FilePath || !googleDriveFolderId) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  res.status(200).json({
    status: "received",
    payload: camelToSnake(payload),
    transfer_id: payload.transferId,
  });

  const command = new S3ToGDriveTransferCommand(payload);
  await command.execute();
};
