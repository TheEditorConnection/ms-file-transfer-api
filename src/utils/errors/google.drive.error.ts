export class GoogleDriveError extends Error {
  // Unique identifier for the Google Drive file related to this error
  public fileId: string;

  // Operation that was being performed when the error occurred (e.g., "download", "upload")
  public operation: string;

  // The original error that was caught, which caused this custom error to be created
  public originalError: Error;

  /**
   * Constructs a GoogleDriveError instance with additional context about the error.
   *
   * @param fileId - The Google Drive file ID associated with the operation that caused the error.
   * @param operation - A string describing the operation (e.g., "fetch file name", "upload file").
   * @param originalError - The original Error object caught during the operation, containing the root cause.
   */
  constructor(fileId: string, operation: string, originalError: Error) {
    // Call the parent Error constructor with a custom message combining operation details and the original error's message
    super(
      `Google Drive Error during ${operation} for file ID: ${fileId} - ${originalError.message}`,
    );

    // Set the error name to identify this as a GoogleDriveError
    this.name = "GoogleDriveError";

    // Store additional context for further reference or debugging
    this.fileId = fileId;
    this.operation = operation;
    this.originalError = originalError;

    // Append the original error's stack trace to the current stack for comprehensive traceability
    if (originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}
