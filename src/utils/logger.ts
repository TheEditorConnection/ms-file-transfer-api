import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

export class Logger {
    private static logger = createLogger({
        level: 'info',
        format: combine(
            timestamp(),
            errors({ stack: true }),
            customFormat
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.File({ filename: 'combined.log' })
        ]
    });

    public static info(message: string) {
        this.logger.info(message);
    }

    public static error(message: string, error?: Error) {
        this.logger.error(message, error ? { stack: error.stack } : {});
    }

    public static warn(message: string) {
        this.logger.warn(message);
    }

    public static debug(message: string) {
        this.logger.debug(message);
    }
}
