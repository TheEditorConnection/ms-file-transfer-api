import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, PutObjectCommand, CompletedPart } from '@aws-sdk/client-s3';

import { Config } from '../config/config';
import { Logger } from '../utils/logger';

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

    public async uploadFile(buffer: Buffer, filePath: string): Promise<void> {
        try {
            Logger.info(`Uploading file to S3: ${filePath}`);
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: filePath,
                Body: buffer
            });
            await this.s3.send(command);
            Logger.info(`File uploaded successfully: ${filePath}`);
        } catch (error) {
            Logger.error(`Error uploading file to S3: ${filePath}`, error);
            throw error;
        }
    }

    public async startMultipartUpload(filePath: string): Promise<string> {
        try {
            Logger.info(`Starting multipart upload for: ${filePath}`);
            const command = new CreateMultipartUploadCommand({
                Bucket: this.bucketName,
                Key: filePath
            });
            const response = await this.s3.send(command);
            const uploadId = response.UploadId!;
            Logger.info(`Multipart upload started. Upload ID: ${uploadId}`);
            return uploadId;
        } catch (error) {
            Logger.error(`Error starting multipart upload for: ${filePath}`, error);
            throw error;
        }
    }

    public async uploadPart(buffer: Buffer, filePath: string, uploadId: string, partNumber: number, totalSize: number): Promise<string> {
        try {
            Logger.info(`Uploading part ${partNumber} for upload ID: ${uploadId}`);
            const command = new UploadPartCommand({
                Bucket: this.bucketName,
                Key: filePath,
                PartNumber: partNumber,
                UploadId: uploadId,
                Body: buffer
            });
            const response = await this.s3.send(command);
            const eTag = response.ETag!;

            // Calculate and log the progress
            const partSize = buffer.length;
            const uploadedSize = partNumber * partSize;
            const progress = (uploadedSize / totalSize) * 100;
            Logger.info(`Upload progress: ${progress.toFixed(2)}%`);

            Logger.info(`Part ${partNumber} uploaded. ETag: ${eTag}`);
            return eTag;
        } catch (error) {
            Logger.error(`Error uploading part ${partNumber} for upload ID: ${uploadId}`, error);
            throw error;
        }
    }

    public async completeMultipartUpload(filePath: string, uploadId: string, parts: CompletedPart[]): Promise<void> {
        try {
            Logger.info(`Completing multipart upload for: ${filePath}`);
            const command = new CompleteMultipartUploadCommand({
                Bucket: this.bucketName,
                Key: filePath,
                UploadId: uploadId,
                MultipartUpload: { Parts: parts }
            });
            await this.s3.send(command);
            Logger.info(`Multipart upload completed for: ${filePath}`);
        } catch (error) {
            Logger.error(`Error completing multipart upload for: ${filePath}`, error);
            throw error;
        }
    }
}
