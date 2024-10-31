import { S3Service } from "../services/s3.service";
import { GoogleDriveService } from "../services/google.drive.service";
import { Logger } from "../utils/logger";
import { Config } from "../config/config";
import { IClientPayload } from "../interfaces/client.payload.interface";
import { notify } from "../utils/notifier";
import { handleError } from "../utils/errors/error.handler";
import { TransferDirection } from "../utils/enums/transfer.direction.enum";

export class S3ToGDriveTransferCommand {
  private payload: IClientPayload;
  private s3FilePath: string;
  private googleDriveFolderId: string;
  private s3Service: S3Service;
  private googleDriveService: GoogleDriveService;
  private newFileName: string;
  private transferId: string;

  constructor(payload: IClientPayload) {
    this.payload = payload;
    this.s3FilePath = payload.s3FilePath;
    this.googleDriveFolderId = payload.googleDriveFolderId;
    this.newFileName = payload.newFileName;
    this.transferId = payload.transferId;
    this.s3Service = new S3Service();
    this.googleDriveService = new GoogleDriveService();
  }

  public async execute(): Promise<void> {
    const startTime = new Date();

    Logger.info(
      `Starting process to upload S3 file: ${this.s3FilePath} to Google Drive at ${startTime.toISOString()}`,
    );
    Logger.createTransactionLogger(
      this.transferId,
      `Starting process to upload S3 file: ${this.s3FilePath} to Google Drive`,
    );

    try {
      const s3Stream = await this.s3Service.downloadFileAsStream(
        this.s3FilePath,
      );

      const originalFileName = this.s3FilePath.split("/").pop();
      const fileExtension = originalFileName?.split(".").pop();
      const finalFileName =
        this.newFileName && fileExtension
          ? `${this.newFileName.trim()}.${fileExtension}`
          : originalFileName;

      if (!finalFileName) {
        throw new Error("Final file name could not be determined.");
      }

      Logger.info(`Final file name determined: ${finalFileName}`);
      Logger.createTransactionLogger(
        this.transferId,
        `Final file name determined: ${finalFileName}`,
      );

      const driveFileId = await this.googleDriveService.uploadFileStream(
        s3Stream,
        finalFileName,
        this.googleDriveFolderId,
      );

      Logger.info(
        `File uploaded to Google Drive successfully, Drive File ID: ${driveFileId}`,
      );
      Logger.createTransactionLogger(
        this.transferId,
        `File uploaded to Google Drive successfully, Drive File ID: ${driveFileId}`,
      );

      const payload = {
        ...this.payload,
        googleDriveFileId: driveFileId,
        status: "success",
      };

      await notify(this.getUrl(), this.getToken(), payload);

      Logger.createTransactionLogger(
        this.transferId,
        `Payload sent to client: ${JSON.stringify(payload)}`,
      );

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      Logger.logProcessingTime(
        this.transferId,
        duration,
        TransferDirection.S3_TO_GDRIVE,
      );
      Logger.info(
        `Process completed at ${endTime.toISOString()}, total time: ${duration.toFixed(2)} seconds`,
      );
      Logger.createTransactionLogger(
        this.transferId,
        `Process completed at ${endTime.toISOString()}, total time: ${duration.toFixed(2)} seconds`,
      );
    } catch (error) {
      await handleError(
        error,
        this.transferId,
        this.payload,
        this.getUrl(),
        this.getToken(),
      );
    }
  }

  public getUrl(): string {
    return Config.get("URL_S3_TO_GDRIVE");
  }

  public getToken(): string {
    return Config.get("TOKEN_S3_TO_GDRIVE");
  }
}
