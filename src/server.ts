import express from 'express';
import { json } from 'body-parser';
import { WebhookHandler } from './handlers/webhook.handler';

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

app.post('/webhook', WebhookHandler.handle);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
