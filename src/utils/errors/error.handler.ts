import { Logger } from "../logger";
import { IClientPayload } from "../../interfaces/client.payload.interface";
import { notify } from "../notifier";
import { GoogleDriveError } from "./google.drive.error";
import { NotificationError } from "./notification.error";
import { S3Error } from "./s3.error";
import { camelToSnake } from "../case.converter";

/**
 * Handles errors during the transfer process by logging and notifying the client.
 *
 * @param error - The error object caught in the transfer process.
 * @param transferId - The unique transfer ID for this process.
 * @param payload - The client payload used for notification.
 * @param url - The notification URL.
 * @param token - The authentication token for notification.
 */
export const handleError = async (
  error: unknown,
  transferId: string,
  payload: IClientPayload,
  url: string,
  token: string,
): Promise<void> => {
  try {
    // Identify and log the type of error
    if (error instanceof Error) {
      if (error instanceof SyntaxError) {
        Logger.error(`Transfer ID: ${transferId}, Syntax error`, error);
      } else if (error instanceof TypeError) {
        Logger.error(`Transfer ID: ${transferId}, Type error`, error);
      } else if (error instanceof GoogleDriveError) {
        Logger.error(`Transfer ID: ${transferId}, Google Drive error`, error);
      } else if (error instanceof NotificationError) {
        console.log("NotificationError Test");
        Logger.error(`Transfer ID: ${transferId}, Notification error`, error);
      } else if (error instanceof S3Error) {
        Logger.error(`Transfer ID: ${transferId}, S3 error`, error);
      } else {
        Logger.error(`Transfer ID: ${transferId}, Unknown error`, error);
      }

      Logger.createTransactionLogger(
        transferId,
        `Error in transfer process for ID: ${transferId}`,
        error as Error,
      );
    } else {
      // Handle non-Error object cases gracefully
      const unknownError = new Error(String(error));
      Logger.error(
        `Unknown error type in transfer ID: ${transferId}`,
        unknownError,
      );
    }

    // Skip notification if the error is already a NotificationError
    if (error instanceof NotificationError) {
      Logger.info(
        `Skipping notification for transfer ID: ${transferId} due to a NotificationError.`,
      );
      return;
    }

    // Attempt to send failure notification to the client
    try {
      await notify(url, token, {
        ...(camelToSnake(payload) as IClientPayload),
        status: "fail",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      Logger.info(
        `Notification sent successfully for transfer ID: ${transferId}`,
      );
    } catch (notificationError) {
      Logger.createTransactionLogger(
        transferId,
        `Notification failure for transfer ID: ${transferId}`,
        notificationError as Error,
      );
      Logger.error(
        `Failed to send notification for transfer ID: ${transferId}`,
        notificationError as Error,
      );
    }
  } catch (unexpectedError) {
    // Catch any unforeseen errors within handleError itself
    Logger.error(
      `Unexpected error in handleError for transfer ID: ${transferId}`,
      unexpectedError as Error,
    );
  }
};
