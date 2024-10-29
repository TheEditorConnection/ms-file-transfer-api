import { Config } from '../config/config';
import { IClientPayload } from '../interfaces/client.payload.interface';
import { GoogleDriveService } from '../services/google.drive.service';
import { S3Service } from '../services/s3.service';
import { Logger } from '../utils/logger';
import { notify } from '../utils/notifier';

export class DownloadAndUploadCommand {
    private payload: IClientPayload;
    private googleDriveFileId: string;
    private projectId: string;
    private deliveryItemId: string;
    private googleDriveService: GoogleDriveService;
    private s3Service: S3Service;

    constructor(payload: IClientPayload) {
        this.payload = payload;
        this.googleDriveFileId = payload.googleDriveFileId;
        this.projectId = payload.projectId;
        this.deliveryItemId = payload.deliveryItemId;
        this.googleDriveService = new GoogleDriveService();
        this.s3Service = new S3Service();
    }

    public async execute(): Promise<void> {
        const startTime = new Date();

        Logger.info(`Starting streaming upload process for Google Drive file ID: ${this.googleDriveFileId} at ${startTime.toISOString()}`);

        try {
            const fileName = await this.googleDriveService.getFileName(this.googleDriveFileId);
            const fileSize = await this.googleDriveService.getFileSize(this.googleDriveFileId);
            const filePath = `google_drive_upload/${this.projectId}/${this.deliveryItemId}/${this.googleDriveFileId}_${fileName}`;
            Logger.info(`File name retrieved: ${fileName}`)

            const driveStream = await this.googleDriveService.downloadFileAsStream(this.googleDriveFileId);
            const { signedUrl, objectUrl, s3Key } = await this.s3Service.uploadFileStream(driveStream, filePath, fileSize, this.googleDriveFileId);

            Logger.info(`File streamed and uploaded to S3 successfully`);
            Logger.info(`Signed URL: ${signedUrl}`);
            Logger.info(`Object URL: ${objectUrl}`);
            notify(
                this.getUrl(),
                this.getToken(),
                {
                    ...this.payload,
                    status: 'success',
                    awsObjectUrl: objectUrl,
                    awsSignedUrl: signedUrl,
                    awsS3Key: s3Key
                });

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            Logger.info(`Upload process completed at ${endTime.toISOString()}`);
            Logger.info(`Total time taken: ${duration.toFixed(2)} seconds`);

        } catch (error) {
            Logger.error(`Error during file upload process`, error);
            notify(
                this.getUrl(),
                this.getToken(),
                {
                    ...this.payload,
                    status: 'fail',
                    error: error.message
                });
        }
    }

    public getUrl(): string {
        return Config.get('URL_GDRIVE_TO_S3');
    }

    public getToken(): string {
        return Config.get('TOKEN_GDRIVE_TO_S3');
    }
}
