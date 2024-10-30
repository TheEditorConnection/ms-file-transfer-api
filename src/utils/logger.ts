import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logDirectory = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

const loggerInstance = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
        new transports.File({ filename: path.join(logDirectory, 'activity.log') })
    ]
});

const processingTimeLogger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        customFormat
    ),
    transports: [
        new transports.File({ filename: path.join(logDirectory, 'processing_times.log'), level: 'info' })
    ]
});

export const Logger = {
    loggerInstance,
    processingTimeLogger,

    info(message: string): void {
        this.loggerInstance.info(message);
    },

    error(message: string, err?: Error): void {
        if (err) {
            // Log both the custom message and error stack
            this.loggerInstance.error(`${message} - ${err.message}`, { stack: err.stack });
        } else {
            this.loggerInstance.error(message);
        }
    },

    warn(message: string): void {
        this.loggerInstance.warn(message);
    },

    debug(message: string): void {
        this.loggerInstance.debug(message);
    },

    createTransactionLogger(transferId: string, message: string, error?: Error): void {
        const date = new Date().toISOString().split('T')[0];
        const transactionLogDir = path.join(logDirectory, date);

        if (!fs.existsSync(transactionLogDir)) {
            fs.mkdirSync(transactionLogDir, { recursive: true });
        }

        const transactionLogFile = path.join(transactionLogDir, `${transferId}.log`);

        const transactionTransport = new transports.File({ filename: transactionLogFile, level: 'info' });

        this.loggerInstance.add(transactionTransport);

        if (error) {
            this.loggerInstance.error(message, error);
        } else {
            this.loggerInstance.info(message);
        }
        this.loggerInstance.remove(transactionTransport);
    },

    logProcessingTime(transferId: string, duration: number, direction: string): void {
        this.processingTimeLogger.info(`Transfer ID: ${transferId}, Direction: ${direction}, Processing time: ${duration.toFixed(2)} seconds`);
    }
};
