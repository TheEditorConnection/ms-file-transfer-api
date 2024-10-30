import { google, drive_v3 } from "googleapis";
import * as stream from "stream";

import { Config } from "../config/config";
import { Logger } from "../utils/logger";
import { GoogleDriveError } from "../utils/errors/google.drive.error";

export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor() {
    const credentials = Config.getCredentialsJson();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    this.drive = google.drive({ version: "v3", auth });
  }

  public async getFileName(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: "name",
        supportsAllDrives: true,
      });
      const fileName = response.data.name || "";
      return fileName;
    } catch (error) {
      Logger.error(`Error fetching file name for file ID: ${fileId}`, error);
      throw new GoogleDriveError(fileId, "fetch file name", error as Error);
    }
  }

  public async getFileSize(fileId: string): Promise<number> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: "size",
        supportsAllDrives: true,
      });
      const fileSize = parseInt(response.data.size || "0", 10);
      return fileSize;
    } catch (error) {
      Logger.error(`Error fetching file size for file ID: ${fileId}`, error);
      throw new GoogleDriveError(
        fileId,
        "download file as stream",
        error as Error,
      );
    }
  }

  public async downloadFileAsStream(fileId: string): Promise<stream.Readable> {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "stream" },
      );
      return response.data as stream.Readable;
    } catch (error) {
      Logger.error(
        `Error starting download stream for file ID: ${fileId}`,
        error,
      );
      throw new GoogleDriveError(
        fileId,
        "download file as stream",
        error as Error,
      );
    }
  }

  public async uploadFileStream(
    readableStream: stream.Readable,
    fileName: string,
    folderId: string,
  ): Promise<string> {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: "application/octet-stream",
        body: readableStream,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
        supportsAllDrives: true,
      });

      const fileId = response.data.id;
      if (!fileId) {
        throw new GoogleDriveError(
          fileName,
          "upload file",
          new Error("File ID is undefined after upload."),
        );
      }

      Logger.info(`File uploaded to Google Drive with ID: ${fileId}`);
      return fileId;
    } catch (error) {
      Logger.error(`Error uploading file to Google Drive: ${fileName}`, error);
      throw new GoogleDriveError(fileName, "upload file", error as Error);
    }
  }
}
