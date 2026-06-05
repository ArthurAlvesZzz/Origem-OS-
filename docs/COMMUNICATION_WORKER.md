# Setups for Communication Worker

## Architecture
The communication worker in GestãoOS uses atomic claim semantics via `CommunicationQueue` updates and atomic database locking, ensuring that in a multi-instance scaling environment, queue items are never processed by more than one instance. 

`claimedBy` is set via UUID during a transactionally-safe `updateMany` lookup mapping. `lockedUntil` guarantees that stalled workers do not lock items indefinitely; they are retried if expired.

## Envs
- `COMMUNICATION_WORKER_ENABLED="true"` must be explicitly set if running the embedded interval worker.
- `INTERNAL_CRON_TOKEN="...secret..."` must be configured in `NODE_ENV=production`. This secures the `/api/crm/queue/process-once` endpoint if using an external cron like Vercel Scheduler, Google Cloud Scheduler, or GitHub Actions.

## Setting up External Cron
Send a POST request to:
`https://your-domain.com/api/crm/queue/process-once`
Header:
`Authorization: Bearer <Your_INTERNAL_CRON_TOKEN>`

Or use the query parameter:
`?token=<Your_INTERNAL_CRON_TOKEN>`

## Credential Encryption
Credentials for WhatsApp Cloud API and Twilio SMS are encrypted using `CRM_CREDENTIALS_ENCRYPTION_KEY` via AES-256-GCM. 
Always perform rotations using the `/api/crm/channels/whatsapp/rotate` endpoints.
