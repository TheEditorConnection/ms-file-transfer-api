import { CompletedPart } from "@aws-sdk/client-s3";
import { Config } from "../config/config";
import { GoogleDriveService } from "../services/google.drive.service";
import { S3Service } from "../services/s3.service";
import { Notifier } from "../utils/notifier";


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
        try {
            const fileName = await this.googleDriveService.getFileName(this.googleDriveFileId);
            const filePath = `google_drive_upload/${this.projectId}/${this.deliveryItemId}/${this.googleDriveFileId}_${fileName}`;
            const fileBuffer = await this.googleDriveService.downloadFile(this.googleDriveFileId, 1024 * 1024 * 5);

            const fileSize = fileBuffer.byteLength;
            if (fileSize <= 1024 * 1024 * 100) {
                await this.s3Service.uploadFile(fileBuffer, filePath);
            } else {
                const uploadId = await this.s3Service.startMultipartUpload(filePath);
                const partTags: CompletedPart[] = [];
                let partNumber = 1;

                for (let start = 0; start < fileSize; start += 1024 * 1024 * 5) {
                    const end = Math.min(start + 1024 * 1024 * 5, fileSize);
                    const chunk = fileBuffer.slice(start, end);
                    const eTag = await this.s3Service.uploadPart(chunk, filePath, uploadId, partNumber);
                    partTags.push({ ETag: eTag, PartNumber: partNumber });
                    partNumber++;
                }

                await this.s3Service.completeMultipartUpload(filePath, uploadId, partTags);
            }

            const awsObjectUrl = `https://${Config.get('S3_BUCKET_NAME')}.s3.${Config.get('AWS_REGION')}.amazonaws.com/${filePath}`;
            Notifier.notify(this.callbackUrl, {
                googleDriveFileId: this.googleDriveFileId,
                deliveryItemId: this.deliveryItemId,
                projectId: this.projectId,
                status: 'success',
                awsObjectUrl: awsObjectUrl
            });
        } catch (error) {
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