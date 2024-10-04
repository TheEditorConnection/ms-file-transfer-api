import { google, drive_v3 } from 'googleapis';
import * as stream from 'stream';

import { Config } from '../config/config';
import { Logger } from '../utils/logger';

export class GoogleDriveService {
    private drive: drive_v3.Drive;

    constructor() {
        const credentials = Config.getCredentialsJson();
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        this.drive = google.drive({ version: 'v3', auth });
        Logger.info('GoogleDriveService initialized.');
    }

    public async getFileName(fileId: string): Promise<string> {
        try {
            Logger.info(`Fetching file name for file ID: ${fileId}`);
            const response = await this.drive.files.get({
                fileId,
                fields: 'name',
                supportsAllDrives: true
            });
            const fileName = response.data.name || '';
            Logger.info(`File name retrieved: ${fileName}`);
            return fileName;
        } catch (error) {
            Logger.error(`Error fetching file name for file ID: ${fileId}`, error);
            throw error;
        }
    }

    public async getFileSize(fileId: string): Promise<number> {
        try {
            Logger.info(`Fetching file size for file ID: ${fileId}`);
            const response = await this.drive.files.get({
                fileId,
                fields: 'size',
                supportsAllDrives: true
            });
            const fileSize = parseInt(response.data.size || '0', 10);
            Logger.info(`File size retrieved: ${fileSize} bytes`);
            return fileSize;
        } catch (error) {
            Logger.error(`Error fetching file size for file ID: ${fileId}`, error);
            throw error;
        }
    }

    public async downloadFileAsStream(fileId: string): Promise<stream.Readable> {
        try {
            Logger.info(`Starting stream download for file ID: ${fileId}`);
            const response = await this.drive.files.get(
                { fileId, alt: 'media', supportsAllDrives: true },
                { responseType: 'stream' }
            );
            Logger.info(`Download stream started for file ID: ${fileId}`);
            return response.data as stream.Readable;
        } catch (error) {
            Logger.error(`Error starting download stream for file ID: ${fileId}`, error);
            throw error;
        }
    }

    public async uploadFileStream(readableStream: stream.Readable, fileName: string, folderId: string): Promise<string> {
        try {
            Logger.info(`Uploading file: ${fileName} to Google Drive`);

            const fileMetadata = {
                name: fileName,
                parents: [folderId]
            };

            const media = {
                mimeType: 'application/octet-stream',
                body: readableStream
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id'
            });

            const fileId = response.data.id!;
            Logger.info(`File uploaded to Google Drive with ID: ${fileId}`);
            return fileId;
        } catch (error) {
            Logger.error(`Error uploading file to Google Drive: ${fileName}`, error);
            throw error;
        }
    }
}
