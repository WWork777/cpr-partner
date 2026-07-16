# Деплой на свой VPS

Проект — TanStack Start (React 19 + Vite 7) + Supabase. По умолчанию билд
заточен под Cloudflare Workers (через nitro). Для VPS нужно собрать под
Node-сервер и поднять процесс под reverse-proxy (nginx/caddy).

---

## 1. Что взять с собой при переезде

### Код
```
git clone <repo>
cd <project>
```

### База данных (Supabase → свой Postgres)
Вариант A — оставить managed Supabase, просто переехать фронтом.
Вариант B — поднять self-hosted Supabase (docker-compose) и перелить дамп.
Вариант C — переписать на чистый Postgres + свой бэкенд (тогда нужно
заменить `src/integrations/supabase/*` на свой клиент).

Все миграции уже лежат в `supabase/migrations/` — можно применить к любому
Postgres (`psql -f`).

Бакет файлов (`course-images`) — выгрузить и положить либо в S3-совместимое
хранилище, либо локально + раздавать nginx-ом. URL картинок хранятся как
полные ссылки в БД, так что после переноса прогоните `UPDATE` по доменам.

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

## 5. Supabase-прокси (если оставляешь managed)

Если хочешь спрятать Supabase за своим доменом — поставь его на
поддомен и пропиши в `.env`:

```
VITE_SUPABASE_URL=https://db.cpr-partner.ru
SUPABASE_URL=https://db.cpr-partner.ru
```

nginx для прокси:
```nginx
server {
  listen 443 ssl http2;
  server_name db.cpr-partner.ru;
  location / {
    proxy_pass https://YOUR-PROJECT.supabase.co;
    proxy_set_header Host YOUR-PROJECT.supabase.co;
    proxy_ssl_server_name on;
  }
}
```

---

## 6. Переход на свой Postgres (вариант C)

1. Применить миграции: `psql $DATABASE_URL -f supabase/migrations/*.sql`
2. Заменить `src/integrations/supabase/client.ts` на свой fetch-клиент
   (PostgREST/Hasura/собственный API).
3. Все запросы идут через `src/lib/queries.ts` и `*.functions.ts` — точечно
   перепишутся, RLS-политики надо будет либо повторить, либо унести в
   серверные функции.
4. Storage (`course-images`) — заменить на S3/MinIO; `ImageUpload.tsx` и
   `admin.banners.tsx` ходят в `supabase.storage.from(...)`.

---

## 7. Чек-лист перед прод-запуском

- [ ] `.env` создан, секреты НЕ в git (`.gitignore` уже исключает `.env`)
- [ ] `bun run build` проходит локально
- [ ] CORS Supabase разрешает домен `https://cpr-partner.ru`
- [ ] Перенесён бакет `course-images` (или прописан новый URL)
- [ ] В админке создан пользователь с ролью `admin` (миграция уже есть)
- [ ] nginx раздаёт `/robots.txt` и `/sitemap.xml` (это маршруты приложения)
- [ ] Настроены бэкапы Postgres (`pg_dump` в cron)

---

## Полезные команды

```bash
bun run build              # прод-сборка
bun run preview            # локально проверить прод-сборку
node .output/server/index.mjs
psql $DATABASE_URL -f supabase/migrations/<file>.sql
```

Логин админа сейчас: `admin@cpr-partner.local` / `CprAdmin!2026`
(после миграции на свою БД пересоздать через `auth.users` + `user_roles`).
