import express from 'express';
import { json } from 'body-parser';
import { WebhookHandler } from './handlers/webhook.handler';
import { Logger } from './utils/logger';
import { UploadWebhookHandler } from './handlers/upload.webhook.handler';

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

app.post('/send-to-s3', WebhookHandler.handle);
app.post('/send-to-gdrive', UploadWebhookHandler.handle);

app.listen(port, () => {
    Logger.info(`\n====================================\n🚀 Server running on port ${port}\n====================================\n`);
});