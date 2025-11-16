FROM node:22-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Копируем package.json отдельно для кэширования
COPY src/package*.json ./

RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Копируем остальные файлы
COPY src/ ./

# Создаем директорию для конфигов
RUN mkdir -p /app/config && \
    chown -R app:app /app/config && \
    mv templates.json /app/config/

RUN chown -R app:app /app

USER app

EXPOSE 3000

CMD ["node", "server.js"]