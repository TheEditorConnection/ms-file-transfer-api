import axios from "axios";
import { camelToSnake } from "./case.converter";
import { Logger } from "./logger";
import { IClientPayload } from "../interfaces/client.payload.interface";
import { NotificationError } from "./errors/notification.error";

/**
 * Sends a notification to the specified URL with the provided payload.
 *
 * @param url - The notification URL.
 * @param token - Authorization token for the notification.
 * @param payload - The payload to send in the notification.
 */
export const notify = async (
  url: string,
  token: string,
  payload: IClientPayload,
): Promise<void> => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    await axios.post(url, camelToSnake(payload), { headers });
    Logger.info(`Notification sent: ${JSON.stringify(payload)}`);
  } catch (error) {
    const notificationError = new NotificationError(
      url,
      payload,
      error as Error,
    );
    Logger.error(
      `Transfer ID: ${payload.transferId}, Failed to send notification`,
      notificationError,
    );
    Logger.createTransactionLogger(
      payload.transferId,
      `Failed to send notification for URL: ${url}`,
      notificationError,
    );
  }
};
