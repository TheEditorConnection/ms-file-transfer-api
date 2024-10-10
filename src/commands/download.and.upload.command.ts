import { GoogleDriveService } from '../services/google.drive.service';
import { JWTService } from '../services/jwt.service';
import { S3Service } from '../services/s3.service';
import { Logger } from '../utils/logger';
import { Notifier } from '../utils/notifier';

export class DownloadAndUploadCommand {
    private payload: any;
    private googleDriveFileId: string;
    private projectId: string;
    private deliveryItemId: string;
    private googleDriveService: GoogleDriveService;
    private s3Service: S3Service;
    private jwtService: JWTService;
    private authorizationToken: string;

    constructor(payload: any, authorizationToken: string) {
        this.payload = payload;
        this.googleDriveFileId = payload.googleDriveFileId;
        this.projectId = payload.projectId;
        this.deliveryItemId = payload.deliveryItemId;
        this.googleDriveService = new GoogleDriveService();
        this.s3Service = new S3Service();
        this.jwtService = new JWTService();
        this.authorizationToken = authorizationToken;
    }

    public async execute(): Promise<void> {
        const startTime = new Date();
        const tokenIsValid = await this.jwtService.verify(this.authorizationToken);

        if (!tokenIsValid) {
            return;
        }

        Logger.info(`Starting streaming upload process for Google Drive file ID: ${this.googleDriveFileId} at ${startTime.toISOString()}`);

        try {
            const fileName = await this.googleDriveService.getFileName(this.googleDriveFileId);
            const fileSize = await this.googleDriveService.getFileSize(this.googleDriveFileId);  // Obtener el tamaño del archivo
            const filePath = `google_drive_upload/${this.projectId}/${this.deliveryItemId}/${this.googleDriveFileId}_${fileName}`;
            Logger.info(`File name retrieved: ${fileName}`)

            const driveStream = await this.googleDriveService.downloadFileAsStream(this.googleDriveFileId);
            const awsObjectUrl = await this.s3Service.uploadFileStream(driveStream, filePath, fileSize, this.googleDriveFileId);

            Logger.info(`File streamed and uploaded to S3 successfully`);
            Logger.info(`File URL: ${awsObjectUrl}`);
            Notifier.notify({
                ...this.payload,
                status: 'success',
                awsObjectUrl: awsObjectUrl
            });

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            Logger.info(`Upload process completed at ${endTime.toISOString()}`);
            Logger.info(`Total time taken: ${duration.toFixed(2)} seconds`);

        } catch (error) {
            Logger.error(`Error during file upload process`, error);
            Notifier.notify({
                ...this.payload,
                status: 'fail',
                error: error.message
            });
        }
    }
}
