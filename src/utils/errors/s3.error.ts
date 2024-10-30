export class S3Error extends Error {
  public filePath: string;
  public operation: string;
  public googleDriveFileId?: string;
  public originalError: Error;

  /**
   * Constructs an S3Error instance with additional context about the error.
   *
   * @param filePath - The path of the file in S3 related to this error.
   * @param operation - The operation that was being performed when the error occurred (e.g., "upload", "download").
   * @param originalError - The original Error object caught during the operation, containing the root cause.
   * @param googleDriveFileId - Optional ID of the Google Drive file related to the S3 operation.
   */
  constructor(
    filePath: string,
    operation: string,
    originalError: Error,
    googleDriveFileId?: string,
  ) {
    super(
      `S3 Error during ${operation} for file path: ${filePath} - ${originalError.message}`,
    );
    this.name = "S3Error";
    this.filePath = filePath;
    this.operation = operation;
    this.googleDriveFileId = googleDriveFileId;
    this.originalError = originalError;

    // Append the original error's stack trace to this error's stack for comprehensive traceability
    if (originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}
