import { S3Service } from '../services/s3.service';
import { GoogleDriveService } from '../services/google.drive.service';
import { Logger } from '../utils/logger';
import { Notifier } from '../utils/notifier';

export class UploadToGoogleDriveCommand {
    private s3FilePath: string;
    private googleDriveFolderId: string;
    private callbackUrl: string;
    private s3Service: S3Service;
    private googleDriveService: GoogleDriveService;

    constructor(s3FilePath: string, googleDriveFolderId: string, callbackUrl: string) {
        this.s3FilePath = s3FilePath;
        this.googleDriveFolderId = googleDriveFolderId;
        this.callbackUrl = callbackUrl;
        this.s3Service = new S3Service();
        this.googleDriveService = new GoogleDriveService();
    }

    public async execute(): Promise<void> {
        const startTime = new Date();

        Logger.info(`Starting process to upload S3 file: ${this.s3FilePath} to Google Drive at ${startTime.toISOString()}`);

        try {
            // Descargar el archivo de S3 como stream
            const s3Stream = await this.s3Service.downloadFileAsStream(this.s3FilePath);

            // Subir el archivo a Google Drive
            const fileName = this.s3FilePath.split('/').pop(); // Obtener el nombre del archivo de la ruta
            const driveFileId = await this.googleDriveService.uploadFileStream(s3Stream, fileName!, this.googleDriveFolderId);

            Logger.info(`File uploaded to Google Drive successfully, Drive File ID: ${driveFileId}`);

            // Notificar el éxito
            Notifier.notify(this.callbackUrl, {
                s3FilePath: this.s3FilePath,
                googleDriveFileId: driveFileId,
                status: 'success'
            });

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            Logger.info(`Process completed at ${endTime.toISOString()}, total time: ${duration.toFixed(2)} seconds`);

        } catch (error) {
            Logger.error('Error during file upload to Google Drive', error);

            // Notificar en caso de error
            Notifier.notify(this.callbackUrl, {
                s3FilePath: this.s3FilePath,
                status: 'fail',
                error: error.message
            });
        }
    }
}
