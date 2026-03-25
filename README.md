# Power-off Telegram bot

Telegram bot for Hacomal Residential that lets each user save today's outage anchor and then check today's, tomorrow's, or the next outage time in Amharic.

## Stack

- TypeScript + `pnpm`
- `node-telegram-bot-api`
- Neon Postgres
- Drizzle ORM
- Vercel webhook route for production

## Environment

Create `.env` from `.env.example` and set:

- `BOT_TOKEN`
- `DATABASE_URL`
- `PUBLIC_BASE_URL`
- `WEBHOOK_SECRET`

`PUBLIC_BASE_URL` should be your stable Vercel production URL or custom domain.

## Local development

```bash
pnpm install
pnpm dev
```

Local development uses Telegram long polling and the same Neon database.
Starting local dev clears any active webhook first, then starts polling.
If your Vercel deployment is already live, run `pnpm webhook:set` again after local testing so production receives updates again.

## Database

The app bootstraps the `user_settings` table automatically at runtime.

If you want Drizzle to manage schema explicitly:

```bash
pnpm db:push
```

## Vercel deployment

Production uses a webhook endpoint:

`{PUBLIC_BASE_URL}/api/telegram/{WEBHOOK_SECRET}`

After the app is deployed, register the webhook once:

```bash
pnpm webhook:set
```

Useful endpoints:

- `POST /api/telegram/[secret]` for Telegram webhook updates
- `GET /api/health` for a simple health check

## Notes

- No local file storage is used in production.
- User settings are stored in Neon, so Vercel cold starts and redeploys do not lose data.
