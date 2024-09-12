import express from 'express';
import { json } from 'body-parser';
import { WebhookHandler } from './handlers/webhook.handler';
import { Logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

app.post('/webhook', WebhookHandler.handle);

app.listen(port, () => {
    Logger.info(`\n====================================\n🚀 Server running on port ${port}\n====================================\n`);
});