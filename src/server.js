import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { getMessage } from './message-templates.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки логирования
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const MESSAGE_LOG = process.env.MESSAGE_LOG === 'true';

// Middleware для логирования входящих запросов
app.use((req, res, next) => {
  if (MESSAGE_LOG) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Incoming request',
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body
    };
    console.log(JSON.stringify(logData));
  }
  next();
});

app.use(bodyParser.json());

app.post('/alert', async (req, res) => {
  const { token, chat_id, message_thread_id } = req.query;
  if (!token || !chat_id) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Missing token or chat_id',
      query: req.query
    };
    console.error(JSON.stringify(logData));
    return res.status(400).json({ error: 'Missing token or chat_id' });
  }

  let alertData;
  try {
    alertData = req.body;
  } catch (err) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Invalid JSON payload',
      error: err.message,
      stack: err.stack
    };
    console.error(JSON.stringify(logData));
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const level = alertData.level || 'Unknown';
  const type = alertData.data?.type || 'Unknown';
  const name = alertData.data?.data?.name || 'Unnamed';
  const alertTargetType = alertData.target?.type || 'Unknown Target Type';
  const alertInfoData = alertData.data?.data || { info: 'No alert data available' };
  const resolved = alertData.resolved ? '✅' : '❌';

  const levelEmoji = {
    'CRITICAL': '🔴',
    'ERROR': '🚨',
    'WARNING': '⚠️',
    'INFO': 'ℹ️',
    'OK': '✅'
  }[level.toUpperCase()] || 'ℹ️';

  let message = getMessage(type, level, alertInfoData);
  
  if (!message) {
    // Fallback to old format if no template found
    message = `${levelEmoji} ${level} - ${type}\n` +
              `*Name*: ${name} (${alertTargetType})\n` +
              `*Resolved*: ${resolved}\n` +
              `*Data*: ${JSON.stringify(alertInfoData, null, 2)}`;
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Using fallback message format',
      type: type
    };
    console.log(JSON.stringify(logData));
  }

  try {
    const telegramPayload = {
      chat_id,
      text: message,
      parse_mode: 'Markdown',
      ...(message_thread_id && { message_thread_id })
    };
    
    if (MESSAGE_LOG) {
      const logData = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Outgoing Telegram message',
        payload: telegramPayload
      };
      console.log(JSON.stringify(logData));
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramPayload)
    });
    const data = await response.json();

    if (!data.ok) {
      const logData = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Telegram API error',
        description: data.description,
        response: data
      };
      console.error(JSON.stringify(logData));
      return res.status(500).json({ error: data.description });
    }

    const logData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Message sent successfully',
      chat_id: chat_id,
      message_thread_id: message_thread_id,
      alertData: alertData
    };
    if (MESSAGE_LOG) {
      logData.response = {
        status: 200,
        body: { success: true }
      };
    }
    console.log(JSON.stringify(logData));
    return res.status(200).json({ success: true });
  } catch (err) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Failed to send message to Telegram',
      error: err.message,
      stack: err.stack
    };
    console.error(JSON.stringify(logData));
    return res.status(500).json({ error: 'Failed to send message to Telegram' });
  }
});

app.listen(PORT, () => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Telegram notifier started',
    port: PORT,
    logLevel: LOG_LEVEL,
    logRequests: MESSAGE_LOG,
    logResponses: MESSAGE_LOG
  };
  console.log(JSON.stringify(logData));
});