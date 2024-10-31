import { createLogger, format, transports } from "winston";
import * as path from "path";
import * as fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Config } from "../config/config";
import { Readable } from "stream";

const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logDirectory = path.join(__dirname, "../../logs");
const isProduction = Config.get("NODE_ENV") === "production";
const internalLoggingEnabled = Config.get("INTERNAL_LOGGING") === "true";
const s3BucketName = Config.get("LOG_S3_BUCKET_NAME");
const s3LogDirectory = Config.get("S3_LOG_DIRECTORY");

if (!fs.existsSync(logDirectory) && !isProduction) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const loggerInstance = createLogger({
  level: "info",
  format: combine(timestamp(), errors({ stack: true }), customFormat),
  transports: [
    new transports.Console(),
    ...(isProduction && !internalLoggingEnabled
      ? []
      : [
          new transports.File({
            filename: path.join(logDirectory, "error.log"),
            level: "error",
          }),
          new transports.File({
            filename: path.join(logDirectory, "activity.log"),
          }),
        ]),
  ],
});

const processingTimeLogger = createLogger({
  level: "info",
  format: combine(timestamp(), customFormat),
  transports: [
    ...(isProduction && !internalLoggingEnabled
      ? []
      : [
          new transports.File({
            filename: path.join(logDirectory, "processing_times.log"),
            level: "info",
          }),
        ]),
  ],
});

const s3Client = isProduction
  ? new S3Client({ region: Config.get("LOG_S3_REGION") })
  : null;

async function getExistingLogContentFromS3(filename: string): Promise<string> {
  if (!s3Client || !s3BucketName || !s3LogDirectory) return ""; // Verificación adicional

  const logKey = path.join(s3LogDirectory, filename);

  try {
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: logKey,
    });
    const response = await s3Client.send(command);

    // Read the content from the S3 object
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
  } catch (error) {
    console.error(`Failed to get log content from S3: ${logKey}`, error);
    return "";
  }
}

async function uploadLogToS3(filename: string, content: string) {
  if (!s3Client || !s3BucketName || !s3LogDirectory) return;

  const logKey = path.join(s3LogDirectory, filename);
  const existingContent = await getExistingLogContentFromS3(filename);

  // Combine existing content with new content
  const updatedContent = `${existingContent}\n${content}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: logKey,
        Body: updatedContent,
      }),
    );
    console.log(`Uploaded log to S3: ${logKey}`);
  } catch (error) {
    console.error(`Failed to upload log to S3: ${logKey}`, error);
  }
}

export const Logger = {
  loggerInstance,
  processingTimeLogger,

  info(message: string): void {
    this.loggerInstance.info(message);

    if (isProduction) uploadLogToS3("activity.log", message);
  },

  error(message: string, err?: Error): void {
    const logMessage = err ? `${message} - ${err.message}` : message;
    this.loggerInstance.error(logMessage, { stack: err?.stack });

    if (isProduction) uploadLogToS3("error.log", logMessage);
  },

  warn(message: string): void {
    this.loggerInstance.warn(message);
  },

  debug(message: string): void {
    this.loggerInstance.debug(message);
  },

  createTransactionLogger(
    transferId: string,
    message: string,
    error?: Error,
  ): void {
    const date = new Date().toISOString().split("T")[0];
    const transactionLogDir = path.join(logDirectory, date);
    const transactionLogFile = path.join(
      transactionLogDir,
      `${transferId}.log`,
    );
    const transactionMessage = error
      ? `${message} - ${error.message}`
      : message;

    if (!isProduction || internalLoggingEnabled) {
      if (!fs.existsSync(transactionLogDir)) {
        fs.mkdirSync(transactionLogDir, { recursive: true });
      }

      const transactionTransport = new transports.File({
        filename: transactionLogFile,
        level: "info",
      });
      this.loggerInstance.add(transactionTransport);
      this.loggerInstance.info(transactionMessage);
      this.loggerInstance.remove(transactionTransport);
    }

    // Subir el log específico de transferencia a S3 en producción
    if (isProduction) {
      uploadLogToS3(`${date}/${transferId}.log`, transactionMessage);
    }
  },

  logProcessingTime(
    transferId: string,
    duration: number,
    direction: string,
  ): void {
    const logMessage = `Transfer ID: ${transferId}, Direction: ${direction}, Processing time: ${duration.toFixed(2)} seconds`;

    if (isProduction) {
      uploadLogToS3("processing_times.log", logMessage);
    } else {
      this.processingTimeLogger.info(logMessage);
    }
  },
};
