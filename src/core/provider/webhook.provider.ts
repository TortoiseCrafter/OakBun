import { defineProvider } from "../factory/provider";
import { createHmac } from 'node:crypto'

export type WebhookEndpoint = {
    url: string;
    secret: string;
}

export type WebhookResult = {
    success: boolean;
    status: number;
    body: string;
}

const webhookProvider = defineProvider('webhookSender').custom(() => ({
    async send(endpoint: WebhookEndpoint, eventName: string, payload: unknown): Promise<WebhookResult> {
        const body = JSON.stringify({
            data: payload,
            event: eventName,
            timestamp: new Date().toISOString()
        })

        const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex')

        try {
            const res = await fetch(endpoint.url, {
                body,
                headers: {
                    'Content-Type': 'application/json',
                    'X-OAK-EVENT': eventName,
                    'X-OAK-SIGNATURE': signature
                },
                method: 'POST'
            })

            return { body: await res.text(), status: res.status, success: res.ok }
        } catch (error: any) {
            return { body: error.message || 'Unknown Error', status: 0, success: false }
        }
    }
}))

export { webhookProvider }