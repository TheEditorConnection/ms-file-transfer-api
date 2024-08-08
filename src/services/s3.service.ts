import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, PutObjectCommand, CompletedPart } from '@aws-sdk/client-s3';

import { Config } from '../config/config';

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
    }

    public async uploadFile(buffer: Buffer, filePath: string): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
            Body: buffer
        });
        await this.s3.send(command);
    }

    public async startMultipartUpload(filePath: string): Promise<string> {
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: filePath
        });
        const response = await this.s3.send(command);
        return response.UploadId!;
    }

    public async uploadPart(buffer: Buffer, filePath: string, uploadId: string, partNumber: number): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: this.bucketName,
            Key: filePath,
            PartNumber: partNumber,
            UploadId: uploadId,
            Body: buffer
        });
        const response = await this.s3.send(command);
        return response.ETag!;
    }

    public async completeMultipartUpload(filePath: string, uploadId: string, parts: CompletedPart[]): Promise<void> {
        const command = new CompleteMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: filePath,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts }
        });
        await this.s3.send(command);
    }
}
