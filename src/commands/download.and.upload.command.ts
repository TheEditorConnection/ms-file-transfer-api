import { Config } from '../config/config';
import { GoogleDriveService } from '../services/google.drive.service';
import { S3Service } from '../services/s3.service';
import { Logger } from '../utils/logger';
import { Notifier } from '../utils/notifier';

export class DownloadAndUploadCommand {
    private googleDriveFileId: string;
    private projectId: string;
    private deliveryItemId: string;
    private callbackUrl: string;
    private googleDriveService: GoogleDriveService;
    private s3Service: S3Service;

    constructor(googleDriveFileId: string, projectId: string, deliveryItemId: string, callbackUrl: string) {
        this.googleDriveFileId = googleDriveFileId;
        this.projectId = projectId;
        this.deliveryItemId = deliveryItemId;
        this.callbackUrl = callbackUrl;
        this.googleDriveService = new GoogleDriveService();
        this.s3Service = new S3Service();
    }

    public async execute(): Promise<void> {
        const startTime = new Date();
        Logger.info(`Starting streaming upload process for Google Drive file ID: ${this.googleDriveFileId} at ${startTime.toISOString()}`);

        try {
            const fileName = await this.googleDriveService.getFileName(this.googleDriveFileId);
            const fileSize = await this.googleDriveService.getFileSize(this.googleDriveFileId);  // Obtener el tamaño del archivo
            const filePath = `google_drive_upload/${this.projectId}/${this.deliveryItemId}/${this.googleDriveFileId}_${fileName}`;
            Logger.info(`File name retrieved: ${fileName}`)

            // Descarga y sube el archivo simultáneamente usando stream
            const driveStream = await this.googleDriveService.downloadFileAsStream(this.googleDriveFileId);
            await this.s3Service.uploadFileStream(driveStream, filePath, fileSize, this.googleDriveFileId);

            Logger.info(`File streamed and uploaded to S3 successfully`);

            const awsObjectUrl = `https://${Config.get('S3_BUCKET_NAME')}.s3.${Config.get('AWS_REGION')}.amazonaws.com/${filePath}`;
            Logger.info(`File URL: ${awsObjectUrl}`);
            Notifier.notify(this.callbackUrl, {
                googleDriveFileId: this.googleDriveFileId,
                deliveryItemId: this.deliveryItemId,
                projectId: this.projectId,
                status: 'success',
                awsObjectUrl: awsObjectUrl
            });

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000; // en segundos
            Logger.info(`Upload process completed at ${endTime.toISOString()}`);
            Logger.info(`Total time taken: ${duration.toFixed(2)} seconds`);

        } catch (error) {
            Logger.error(`Error during file upload process`, error);
            Notifier.notify(this.callbackUrl, {
                googleDriveFileId: this.googleDriveFileId,
                deliveryItemId: this.deliveryItemId,
                projectId: this.projectId,
                status: 'fail',
                error: error.message
            });
        }
    }
}
