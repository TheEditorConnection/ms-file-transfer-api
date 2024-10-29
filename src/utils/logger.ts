import { createLogger, format, transports } from 'winston';
import * as path from 'path';

const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logDirectory = path.join(__dirname, '../../logs');

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
        new transports.File({ filename: path.join(logDirectory, 'combined.log') })
    ]
});

export const Logger = {
    info(message: string): void {
        loggerInstance.info(message);
    },

    error(message: string, err?: Error): void {
        loggerInstance.error(message, err ? { stack: err.stack } : {});
    },

    warn(message: string): void {
        loggerInstance.warn(message);
    },

    debug(message: string): void {
        loggerInstance.debug(message);
    }
};
