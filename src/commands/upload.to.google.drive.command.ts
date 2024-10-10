import { S3Service } from '../services/s3.service';
import { GoogleDriveService } from '../services/google.drive.service';
import { Logger } from '../utils/logger';
import { Notifier } from '../utils/notifier';
import { JWTService } from '../services/jwt.service';

export class UploadToGoogleDriveCommand {
    private payload: any;
    private s3FilePath: string;
    private googleDriveFolderId: string;
    private s3Service: S3Service;
    private googleDriveService: GoogleDriveService;
    private authorizationToken: string;
    private jwtService: JWTService;
    private newFileName: string;

    constructor(payload: any, authorizationToken: string) {
        this.payload = payload;
        this.s3FilePath = payload.s3FilePath;
        this.googleDriveFolderId = payload.googleDriveFolderId;
        this.newFileName = payload.newFileName; // Nombre del archivo proporcionado por el usuario
        this.s3Service = new S3Service();
        this.googleDriveService = new GoogleDriveService();
        this.authorizationToken = authorizationToken;
        this.jwtService = new JWTService();
    }

    public async execute(): Promise<void> {
        const startTime = new Date();

        const tokenIsValid = await this.jwtService.verify(this.authorizationToken);

        if (!tokenIsValid) {
            // Since the error is handled by the verify method i'll just return here
            return;
        }

        Logger.info(`Starting process to upload S3 file: ${this.s3FilePath} to Google Drive at ${startTime.toISOString()}`);

        try {
            const s3Stream = await this.s3Service.downloadFileAsStream(this.s3FilePath);

            const originalFileName = this.s3FilePath.split('/').pop();
            const fileExtension = originalFileName?.split('.').pop();
            const finalFileName = this.newFileName && fileExtension
                ? `${this.newFileName.trim()}.${fileExtension}`
                : originalFileName;

            const driveFileId = await this.googleDriveService.uploadFileStream(s3Stream, finalFileName!, this.googleDriveFolderId);

            Logger.info(`File uploaded to Google Drive successfully, Drive File ID: ${driveFileId}`);

            Notifier.notify({
                ...this.payload,
                status: 'success'
            });

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            Logger.info(`Process completed at ${endTime.toISOString()}, total time: ${duration.toFixed(2)} seconds`);

        } catch (error) {
            Logger.error('Error during file upload to Google Drive', error);

            Notifier.notify({
                ...this.payload,
                status: 'fail',
                error: error.message
            });
        }
    }
}