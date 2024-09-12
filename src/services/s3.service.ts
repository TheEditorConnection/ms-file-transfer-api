import { S3Client } from '@aws-sdk/client-s3';
import { Config } from '../config/config';
import { Logger } from '../utils/logger';
import * as stream from 'stream';
import { Upload } from '@aws-sdk/lib-storage';

export class S3Service {
    private s3: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = Config.get('S3_BUCKET_NAME');
        this.s3 = new S3Client({
            region: Config.get('AWS_REGION'),
            credentials: {
                accessKeyId: Config.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: Config.get('AWS_SECRET_ACCESS_KEY')
            }
        });
        Logger.info('S3Service initialized.');
    }

    public async uploadFileStream(readableStream: stream.Readable, filePath: string): Promise<void> {
        try {
            Logger.info(`Uploading file stream to S3: ${filePath}`);

            const upload = new Upload({
                client: this.s3,
                params: {
                    Bucket: this.bucketName,
                    Key: filePath,
                    Body: readableStream
                }
            });

            await upload.done();
            Logger.info(`File stream uploaded successfully: ${filePath}`);
        } catch (error) {
            Logger.error(`Error uploading file stream to S3: ${filePath}`, error);
            throw error;
        }
    }
}
