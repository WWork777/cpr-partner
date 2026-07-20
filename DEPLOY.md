# Деплой на свой VPS

Проект — TanStack Start (React 19 + Vite 7) + собственный PostgreSQL API. По умолчанию билд
заточен под Cloudflare Workers (через nitro). Для VPS нужно собрать под
Node-сервер и поднять процесс под reverse-proxy (nginx/caddy).

---

## 1. Что взять с собой при переезде

### Код
```
git clone <repo>
cd <project>
```

### База данных и файлы
На VPS используется PostgreSQL `cpr` и собственный API приложения. Схема находится
в `server/schema.sql`, а файлы хранятся в каталоге `UPLOADS_DIR` и отдаются через `/uploads/`.

### Секреты
Скопируй `.env.example` → `.env` и заполни (см. ниже).

---

## 2. Сборка под Node (а не Cloudflare)

В `vite.config.ts` укажи nitro-пресет `node-server`:

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: {
    // переопределяем дефолтный cloudflare-пресет nitro
    // @ts-expect-error — прокидывается в nitro
    nitro: { preset: "node-server" },
  },
});
```

Затем:

```bash
bun install            # или npm ci / pnpm i
bun run build          # соберёт .output/ с node-сервером внутри
node .output/server/index.mjs   # запуск
```

Слушает порт из `PORT` (по умолчанию 3000).

---

## 3. systemd-юнит (минимальный)

`/etc/systemd/system/cpr.service`:
```ini
[Unit]
Description=CPR Partner site
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/cpr
EnvironmentFile=/var/www/cpr/.env
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now cpr
```

---

## 4. nginx reverse-proxy + HTTPS

```nginx
server {
  listen 443 ssl http2;
  server_name cpr-partner.ru;

  ssl_certificate     /etc/letsencrypt/live/cpr-partner.ru/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/cpr-partner.ru/privkey.pem;

  client_max_body_size 25m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Сертификат: `certbot --nginx -d cpr-partner.ru -d www.cpr-partner.ru`.

---

## 5. Чек-лист перед прод-запуском

- [ ] `.env` создан, секреты НЕ в git (`.gitignore` уже исключает `.env`)
- [ ] `bun run build` проходит локально
- [ ] PostgreSQL доступен по `DATABASE_URL`
- [ ] Каталог `UPLOADS_DIR` доступен пользователю `www-data`
- [ ] В PostgreSQL создан пользователь с ролью `admin`
- [ ] Для восстановления пароля заполнены `APP_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- [ ] nginx раздаёт `/robots.txt` и `/sitemap.xml` (это маршруты приложения)
- [ ] Настроены бэкапы Postgres (`pg_dump` в cron)

---

## Полезные команды

```bash
bun run build              # прод-сборка
bun run preview            # локально проверить прод-сборку
node .output/server/index.mjs
psql $DATABASE_URL -f server/schema.sql
```

После обновления схемы эта же команда добавит роли менеджеров, права пользователей
и таблицу одноразовых ссылок восстановления пароля. Повторный запуск безопасен.

Логин админа сейчас: `admin@cpr-partner.local` / `CprAdmin!2026`
(после миграции на свою БД пересоздать через `auth.users` + `user_roles`).
