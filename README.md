# NotiQ

NotiQ is a Node.js notification service with a built-in browser tester and admin dashboard.

## Features

- Email notifications
- In-app notifications
- Template-based messages
- Multi-step workflows
- Digest batching
- Browser testing UI at `/`
- Admin dashboard at `/dashboard`

## Important note about `node_modules`

`node_modules` should not be pushed to GitHub.

That folder is generated locally from `package.json` and `package-lock.json` when someone runs `npm install`. Keeping it out of Git is the normal and optimal setup because it:

- keeps the repository small
- avoids committing thousands of generated files
- prevents OS-specific dependency noise
- makes installs reproducible from the lockfile

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
|- dashboard/          # Admin dashboard source + served dist build
|- public/             # Main browser testing UI
|- src/                # API controllers, models, routes, services
|- supabase/           # SQL schema and migrations
|- tests/              # Jest route tests
|- server.js           # Express entrypoint
|- package.json
`- README.md
```

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/anyovic1007-cmd/NotiQ.git
cd NotiQ
```

### 2. Install dependencies

Root app:

```bash
npm install
```

Dashboard source dependencies:

```bash
npm run dashboard:install
```

Or both at once:

```bash
npm run setup
```

### 3. Create your environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
copy .env.example .env
```

### 4. Start the app

```bash
npm start
```

## Environment variables

Local development works without full external infrastructure because the app falls back to in-memory storage when Supabase is not configured.

Optional production-style variables:

```env
SUPABASE_URL=
SUPABASE_KEY=
GMAIL_USER=
GMAIL_PASS=
REDIS_URL=
PORT=3000
```

## Local URLs

- Main UI: [http://localhost:3000/](http://localhost:3000/)
- Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health: [http://localhost:3000/health](http://localhost:3000/health)
- Stats: [http://localhost:3000/health/stats](http://localhost:3000/health/stats)

## Scripts

- `npm start` - run the backend server
- `npm test` - run the Jest suite
- `npm run dashboard:install` - install dashboard dependencies
- `npm run dashboard:build` - build the dashboard from `dashboard/src`
- `npm run setup` - install root and dashboard dependencies

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

## Database setup

To create the full schema in Supabase, run:

- [supabase/schema.sql](C:/Users/Ryo/Desktop/NotiQ/supabase/schema.sql)

## Testing

Run the full backend suite:

```bash
npm test
```

## GitHub checklist

Before pushing changes:

1. Make sure `.env` is not committed.
2. Do not commit `node_modules`.
3. Keep `package-lock.json` committed.
4. Run `npm test`.
5. If dashboard source changed, run `npm run dashboard:build`.

## Notes

- The root UI is a lightweight live tester for the API.
- The `/dashboard` route serves the admin dashboard.
- Local development can run without Supabase or Redis.
- Production should use real Supabase, email credentials, and Redis if queue monitoring is needed.
