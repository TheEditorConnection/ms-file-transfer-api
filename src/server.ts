import express from 'express';
import { json } from 'body-parser';
import { WebhookHandler } from './handlers/webhook.handler';
import { Logger } from './utils/logger';
import { UploadWebhookHandler } from './handlers/upload.webhook.handler';
import dotenv from 'dotenv';

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

app.post('/send-to-s3', WebhookHandler.handle);
app.post('/send-to-gdrive', UploadWebhookHandler.handle);

app.listen(port, () => {
    Logger.info(`\n====================================\n🚀 Server running on port ${port}\n====================================\n`);
});