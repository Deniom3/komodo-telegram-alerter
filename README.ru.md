# Komodo Telegram Alerter

Легковесный сервис Telegram-уведомлений для системы мониторинга [Komodo](https://komo.do).

## Пример уведомления

```
✅ OK - StackAutoUpdated
Для: komodo (Стек)
Решено: ✅
Данные: {
  "id": "685db922720baf6840daffca",
  "name": "komodo",
  "server_id": "6849fbcd598b3a0bc1570303",
  "server_name": "docker-1",
  "images": [
    "mongo:latest"
  ]
}
```

## Быстрый старт (Docker Compose)

1. Создайте новый стек с файлом `compose.yaml`:

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

### Пользовательские шаблоны сообщений

Для настройки текста уведомлений:

1. Создайте директорию `custom-templates` с файлом `templates.json`:
```json
{
  "StackAutoUpdated": {
    "OK": "На сервере {servername} обновлен образ {images} в стеке {name}",
    "INFO": "Идет обновление стека {name} на сервере {servername}",
    "ERROR": "Ошибка обновления стека {name} на сервере {servername}"
  }
}
```
2. Подключите директорию как показано в примере compose

Доступные плейсхолдеры: все поля из объекта данных уведомления.

### Настройка Komodo

В Komodo добавьте Custom Alerter с URL:
`http://<alerter-ip>:3000/alert?token=<TELEGRAM_TOKEN>&chat_id=<TELEGRAM_CHAT_ID>`

Или используйте переменные Komodo:
`http://<alerter-ip>:3000/alert?token=[[TELEGRAM_TOKEN]]&chat_id=[[TELEGRAM_CHAT_ID]]`

**Рекомендация:** Храните учетные данные в [Komodo Secrets & Variables](https://komo.do/docs/variables).

## Получение Telegram-данных

### Токен бота
1. Напишите [@BotFather](https://t.me/botfather)
2. Создайте бота командой `/newbot`
3. Получите токен бота

### ID чата
1. Добавьте бота в нужный чат/канал
2. Отправьте тестовое сообщение
3. Перейдите по ссылке: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
4. Найдите `chat.id` в ответе

### Треды в супергруппах
Для уведомлений в конкретные треды:
1. Отправьте сообщение в тред
2. Получите `message_thread_id` из ответа getUpdates
3. Добавьте в URL: `&message_thread_id=<ID_ТРЕДА>`

## Настройка логирования

Сервис поддерживает детальное логирование в формате JSON. Для настройки используйте переменные окружения:

- `LOG_LEVEL` - уровень детализации логов (debug, info, warn, error). По умолчанию: info
- `MESSAGE_LOG` - логировать входящие/исходящие сообщения (true/false). По умолчанию: false

Пример лога:
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
  },
  "body": {
    "level": "OK",
    "data": {
      "type": "StackAutoUpdated",
      "data": {
        "name": "komodo",
        "server_name": "docker-1"
      }
    }
  }
}
```

Для включения логирования сообщений:
```yaml
environment:
  - MESSAGE_LOG=true
  - LOG_LEVEL=debug
```