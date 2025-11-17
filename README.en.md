# Komodo Telegram Alerter

A lightweight Telegram notification service for [Komodo](https://komo.do) monitoring system.

## Example Notification

```
✅ OK - StackAutoUpdated
For: komodo (Stack)
Resolved: ✅
Data: {
  "id": "685db922720baf6840daffca",
  "name": "komodo",
  "server_id": "6849fbcd598b3a0bc1570303",
  "server_name": "docker-1",
  "images": [
    "mongo:latest"
  ]
}
```

## Quick Start (Docker Compose)

1. Create a new Stack with the following `compose.yaml`:

```yaml
services:
  komodo-telegram-alerter:
    container_name: komodo-telegram-alerter
    image: deniom3/komodo-telegram-alerter:latest
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./custom-templates:/app/templates:ro
```

### Custom Message Templates

To customize notification messages:

1. Create a `custom-templates` directory with `templates.json` file:
```json
{
  "StackAutoUpdated": {
    "OK": "Stack {name} on server {servername} updated image {images}",
    "INFO": "Updating stack {name} on server {servername}",
    "ERROR": "Error updating stack {name} on server {servername}"
  }
}
```
2. Mount the directory as shown in compose example

Supported placeholders: all fields from alert data object.

### Configure Komodo

In Komodo, add Custom Alerter with URL:
`http://<alerter-ip>:3000/alert?token=<TELEGRAM_TOKEN>&chat_id=<TELEGRAM_CHAT_ID>`

Or use Komodo variables:
`http://<alerter-ip>:3000/alert?token=[[TELEGRAM_TOKEN]]&chat_id=[[TELEGRAM_CHAT_ID]]`

**Recommended:** Store credentials in [Komodo Secrets & Variables](https://komo.do/docs/variables).

## Telegram Credentials

### Bot Token
1. Message [@BotFather](https://t.me/botfather)
2. Create new bot with `/newbot`
3. Get your bot token

### Chat ID
1. Add bot to desired chat/channel
2. Send test message
3. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find `chat.id` in response

### Message Threads (Supergroups)
For thread notifications:
1. Send message to thread
2. Get `message_thread_id` from getUpdates response
3. Add to URL: `&message_thread_id=<THREAD_ID>`

## Logging Configuration

The service supports detailed JSON logging. Configure using environment variables:

- `LOG_LEVEL` - log verbosity (debug, info, warn, error). Default: info
- `MESSAGE_LOG` - enable request/response logging (true/false). Default: false

Example log:
```json
{
  "timestamp": "2025-11-17T11:13:34.548Z",
  "level": "info",
  "message": "Incoming request",
  "method": "POST",
  "url": "/alert",
  "headers": {
    "host": "localhost:3000",
    "content-type": "application/json"
  }
}
```

To enable message logging:
```yaml
environment:
  - MESSAGE_LOG=true
  - LOG_LEVEL=debug
```