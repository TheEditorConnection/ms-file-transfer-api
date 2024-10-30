import { Config } from '../config/config';
import { handleError } from '../utils/errors/error.handler';
import { IClientPayload } from '../interfaces/client.payload.interface';
import { GoogleDriveService } from '../services/google.drive.service';
import { S3Service } from '../services/s3.service';
import { TransferDirection } from '../utils/enums/transfer.direction.enum';
import { Logger } from '../utils/logger';
import { notify } from '../utils/notifier';

export class GDriveToS3TransferCommand {
    private payload: IClientPayload;
    private googleDriveFileId: string;
    private projectId: string;
    private deliveryItemId: string;
    private googleDriveService: GoogleDriveService;
    private s3Service: S3Service;
    private transferId: string;

    constructor(payload: IClientPayload) {
        this.payload = payload;
        this.googleDriveFileId = payload.googleDriveFileId;
        this.projectId = payload.projectId;
        this.deliveryItemId = payload.deliveryItemId;
        this.transferId = payload.transferId;
        this.googleDriveService = new GoogleDriveService();
        this.s3Service = new S3Service();
    }

    public async execute(): Promise<void> {
        const startTime = new Date();

        Logger.info(`Starting streaming upload process for Google Drive file ID: ${this.googleDriveFileId} at ${startTime.toISOString()}`);
        Logger.createTransactionLogger(this.transferId, `Starting streaming upload process for Google Drive file ID: ${this.googleDriveFileId}`);

        try {
            const fileName = await this.googleDriveService.getFileName(this.googleDriveFileId);
            const fileSize = await this.googleDriveService.getFileSize(this.googleDriveFileId);
            const filePath = `google_drive_upload/${this.projectId}/${this.deliveryItemId}/${this.googleDriveFileId}_${fileName}`;
            Logger.info(`Google Drive ID: ${this.googleDriveFileId}, File Name: ${fileName}, File Size: ${fileSize} bytes`);
            Logger.createTransactionLogger(this.transferId, `Google Drive ID: ${this.googleDriveFileId}, File Name: ${fileName}, File Size: ${fileSize} bytes`);

            const driveStream = await this.googleDriveService.downloadFileAsStream(this.googleDriveFileId);
            const { signedUrl, objectUrl, s3Key } = await this.s3Service.uploadFileStream(driveStream, filePath, fileSize, this.googleDriveFileId);

            Logger.createTransactionLogger(this.transferId, `Google Drive file ID: ${this.googleDriveFileId} uploaded to S3 successfully`);

            const payload = {
                ...this.payload,
                status: 'success',
                awsObjectUrl: objectUrl,
                awsSignedUrl: signedUrl,
                awsS3Key: s3Key
            };

            notify(this.getUrl(), this.getToken(), payload);

            Logger.createTransactionLogger(this.transferId, `Payload sent to client: ${JSON.stringify(payload)}`);

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            Logger.logProcessingTime(this.transferId, duration, TransferDirection.GDRIVE_TO_S3);
            Logger.info(`Google Drive file ID: ${this.googleDriveFileId} uploaded successfully total time taken: ${duration.toFixed(2)} seconds`);
            Logger.createTransactionLogger(this.transferId, `Google Drive file ID: ${this.googleDriveFileId} uploaded successfully total time taken: ${duration.toFixed(2)} seconds`);

        } catch (error) {
            await handleError(error, this.transferId, this.payload, this.getUrl(), this.getToken());
        }
    }

    public getUrl(): string {
        return Config.get('URL_GDRIVE_TO_S3');
    }

    public getToken(): string {
        return Config.get('TOKEN_GDRIVE_TO_S3');
    }
}
