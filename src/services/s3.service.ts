import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Config } from '../config/config';
import { Logger } from '../utils/logger';
import * as stream from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
    private s3: S3Client;
    private bucketName: string;
    private region: string;

    constructor() {
        this.bucketName = Config.get('S3_BUCKET_NAME');
        this.region = Config.get('AWS_REGION');
        this.s3 = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: Config.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: Config.get('AWS_SECRET_ACCESS_KEY')
            }
        });
        Logger.info('S3Service initialized.');
    }

    public async uploadFileStream(readableStream: stream.Readable, filePath: string, totalSize: number, googleDriveFileId: string): Promise<{ signedUrl: string, objectUrl: string, s3Key: string }> {
        const MAX_RETRIES = 3;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                Logger.info(`Uploading file stream to S3: ${filePath}, attempt ${attempt + 1}, Google Drive File ID: ${googleDriveFileId}`);

                const upload = new Upload({
                    client: this.s3,
                    params: {
                        Bucket: this.bucketName,
                        Key: filePath,
                        Body: readableStream
                    },
                    partSize: 64 * 1024 * 1024,
                    queueSize: 8,
                    leavePartsOnError: false,
                });

                upload.on("httpUploadProgress", (progress) => {
                    if (progress.loaded) {
                        const percentage = (progress.loaded / totalSize) * 100;
                        Logger.info(`Upload progress for Google Drive File ID ${googleDriveFileId}: ${percentage.toFixed(2)}%`);
                    } else {
                        Logger.warn(`Progress information not available for Google Drive File ID: ${googleDriveFileId}`);
                    }
                });

                await upload.done();
                Logger.info(`File stream uploaded successfully to S3 for Google Drive File ID: ${googleDriveFileId}, Path: ${filePath}`);

                const command = new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: filePath
                });
                const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 604800 });
                Logger.info(`Generated signed URL: ${signedUrl}`);

                const objectUrl = signedUrl.split('?')[0];
                Logger.info(`Generated object URL: ${objectUrl}`);

                return { signedUrl, objectUrl, s3Key: filePath };
            } catch (error) {
                Logger.error(`Error uploading file stream to S3: ${filePath} for Google Drive File ID: ${googleDriveFileId}`, error);

                if (attempt >= MAX_RETRIES - 1) {
                    throw error;
                }

                Logger.info(`Retrying upload for file: ${filePath}, Google Drive File ID: ${googleDriveFileId}`);
                attempt++;
            }
        }

        throw new Error('Failed to upload file after maximum retries');
    }

    public async downloadFileAsStream(filePath: string): Promise<stream.Readable> {
        try {
            Logger.info(`Starting download of file from S3: ${filePath}`);

            const getObjectParams = {
                Bucket: this.bucketName,
                Key: filePath
            };

            const command = new GetObjectCommand(getObjectParams);
            const response = await this.s3.send(command);

            Logger.info(`S3 file stream started for: ${filePath}`);
            return response.Body as stream.Readable;
        } catch (error) {
            Logger.error(`Error downloading file from S3: ${filePath}`, error);
            throw error;
        }
    }
}
