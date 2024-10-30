import express from 'express';
import { json } from 'body-parser';
import { Logger } from './utils/logger';
import dotenv from 'dotenv';
import { authentication } from './middleware/authorization';
import { handleS3ToGDriveTransferWebhook } from './handlers/handle.s3.to.gdrive.transfer.webhook';
import { handleGDriveToS3TransferWebhook } from './handlers/handle.gdrive.to.s3.transfer.webhook';
import { generateTransferIdMiddleware } from './middleware/generate.transfer.id.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

app.get('/', (_req, res) => {
    res.status(200).send('OK');
});

app.get('/liveness', (_req, res) => {
    res.status(200).send('Service is alive');
});

app.get('/readiness', (_req, res) => {
    res.status(200).send('Service is ready');
});

app.get('/info', (_req, res) => {
    const appInfo = {
        name: process.env.APP_NAME || 'Unknown',
        version: process.env.APP_VERSION || 'Unknown',
        description: process.env.APP_DESCRIPTION || 'No description available'
    };
    res.status(200).json(appInfo);
});

app.post('/send-to-s3', authentication, generateTransferIdMiddleware, handleGDriveToS3TransferWebhook);
app.post('/send-to-gdrive', authentication, generateTransferIdMiddleware, handleS3ToGDriveTransferWebhook);

app.listen(port, () => {
    Logger.info(`\n====================================\n🚀 Server running on port ${port}\n====================================\n`);
});