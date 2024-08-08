import { google, drive_v3 } from 'googleapis';
import * as stream from 'stream';

import { Config } from '../config/config';

export class GoogleDriveService {
    private drive: drive_v3.Drive;

    constructor() {
        const credentials = Config.getCredentialsJson();
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        this.drive = google.drive({ version: 'v3', auth });
    }

    public async getFileName(fileId: string): Promise<string> {
        const response = await this.drive.files.get({
            fileId,
            fields: 'name',
            supportsAllDrives: true
        });
        return response.data.name || '';
    }

    public async downloadFile(fileId: string, chunkSize: number): Promise<Buffer> {
        const response = await this.drive.files.get(
            { fileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream' }
        );

        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            const passThrough = new stream.PassThrough();
            response.data.pipe(passThrough);

            let totalSize = 0;
            passThrough.on('data', (chunk) => {
                chunks.push(chunk);
                totalSize += chunk.length;
                if (totalSize >= chunkSize) {
                    passThrough.pause();
                    setTimeout(() => passThrough.resume(), 1000);
                }
            });

            passThrough.on('end', () => resolve(Buffer.concat(chunks)));
            passThrough.on('error', reject);
        });
    }
}
