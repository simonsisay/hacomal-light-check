# Power-off Telegram bot

A simple Telegram bot that tells each user what time the power will go off **today** (either **6:30 PM** or **7:30 PM**) in Addis Ababa time, alternating daily after the user sets an initial “today” anchor.

## Setup (manual steps)

1. In Telegram, talk to **@BotFather**:
   - `/newbot`
   - Pick a name + username
   - Copy the **bot token**
2. Create a `.env` file (copy from `.env.example`) and set `BOT_TOKEN`.

## Run locally (long polling)

```bash
pnpm install
pnpm dev
```

### If you see a better-sqlite3 “bindings file” error

That means the optional SQLite native dependency didn’t compile on your machine. Quick fix:

- Set `STORE_BACKEND=json` in your `.env`, then re-run `pnpm dev`.

## Deploy (webhook)

You must host the bot yourself (Telegram does not host bots). For production:

- Set `BOT_TOKEN`, `PUBLIC_BASE_URL`, `WEBHOOK_SECRET`, and storage env vars (`STORE_BACKEND` / `STORE_PATH`).
- Build and start:

```bash
pnpm install
pnpm build
pnpm start
```

The app will set the Telegram webhook to:

`{PUBLIC_BASE_URL}/telegram/{WEBHOOK_SECRET}`
