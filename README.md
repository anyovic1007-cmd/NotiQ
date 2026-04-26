# NotiQ

NotiQ is a Node.js notification service with:

- email notifications
- in-app notifications
- notification templates
- workflow-based multi-step delivery
- digest batching
- a browser testing UI
- an admin dashboard

## Tech stack

- Node.js
- Express
- Supabase
- Nodemailer
- Bull
- Jest
- React + Vite for the dashboard

## Project structure

```text
NotiQ/
├── dashboard/          # Admin dashboard source + served dist build
├── public/             # Main browser testing UI
├── src/                # API controllers, models, routes, services
├── supabase/           # SQL schema and migrations
├── tests/              # Jest route tests
├── server.js           # Express entrypoint
└── package.json
```

## Local setup

### 1. Install dependencies

```powershell
cd "C:\Users\Ryo\Desktop\NotiQ"
cmd /c npm install
```

### 2. Create your environment file

```powershell
copy .env.example .env
```

Current local development works without full external infrastructure because the app falls back to in-memory storage when Supabase is not configured.

Optional production-style variables:

```env
SUPABASE_URL=
SUPABASE_KEY=
GMAIL_USER=
GMAIL_PASS=
REDIS_URL=
PORT=3000
```

### 3. Start the app

```powershell
cmd /c npm start
```

## URLs

- Main UI: [http://localhost:3000/](http://localhost:3000/)
- Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health: [http://localhost:3000/health](http://localhost:3000/health)
- Stats: [http://localhost:3000/health/stats](http://localhost:3000/health/stats)

## Testing

Run the full backend test suite:

```powershell
cmd /c npm test
```

## API highlights

### Notifications

- `POST /notify/inapp`
- `POST /notify/email`
- `GET /notify`
- `GET /notify/:userId`
- `PATCH /notify/:id/read`

### Templates

- `POST /templates`
- `GET /templates`
- `GET /templates/:slug`
- `PATCH /templates/:slug`

### Workflows

- `POST /workflows`
- `GET /workflows`
- `GET /workflows/:slug`
- `POST /workflows/:slug/trigger`
- `GET /workflows/runs/:runId`

### Digest

- `GET /digest/config`
- `POST /digest/config`
- `POST /digest/ingest`
- `POST /digest/flush`
- `GET /digest/events/:key/:userId`

## Supabase

To create the full database schema, run the SQL in:

- [supabase/schema.sql](C:/Users/Ryo/Desktop/NotiQ/supabase/schema.sql)

## GitHub checklist

Before pushing:

1. Make sure `.env` is not committed.
2. Do not commit `node_modules`.
3. Keep `package-lock.json` committed.
4. Commit the source in `dashboard/src` and the served app files you want to publish.
5. Run `cmd /c npm test` and confirm everything is green.

## Notes

- The root browser UI is a lightweight live tester for the API.
- The `/dashboard` route serves the admin dashboard.
- Local development can run without Supabase or Redis, but production should use real infrastructure.
