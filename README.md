# Pip — AI Virtual Pet (Phase 1: Foundation)

Pip is a personal virtual pet with shared state across devices, built in
Node.js + TypeScript with SQLite persistence. This is Phase 1: the state
engine, need decay, care actions, and owner authentication.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure
cp .env.example .env
# Edit .env and set OWNER_PASSWORD to a secret of your choosing

# 3. Run
npm run dev          # development (auto-reload)
# — or —
npm run build && npm start   # production
```

Pip will be listening at `http://localhost:3000`.

## API

Every endpoint except `/api/health` requires an `Authorization` header:

```
Authorization: Bearer <your OWNER_PASSWORD>
```

### Endpoints

| Method | Path                     | Description                              |
|--------|--------------------------|------------------------------------------|
| GET    | `/api/health`            | Health check (no auth)                   |
| GET    | `/api/pet`               | Current pet state with time-based decay  |
| GET    | `/api/pet/personality`   | Pip's character sheet                    |
| GET    | `/api/actions`           | List available care actions              |
| POST   | `/api/actions/:action`   | Perform a care action                    |

### Care actions

| Action    | Primary effect       | Secondary effects         | Cooldown |
|-----------|----------------------|---------------------------|----------|
| `feed`    | hunger +25           | happiness +5              | 60 s     |
| `play`    | happiness +20        | curiosity +10, energy −5  | 60 s     |
| `rest`    | energy +30           | happiness +5              | 120 s    |
| `clean`   | hygiene +30          | happiness +8              | 90 s     |
| `explore` | curiosity +25        | happiness +8, energy −8   | 90 s     |
| `pet`     | affection +25        | happiness +10             | 30 s     |

### Needs & decay

Pip has six needs that slowly decrease over time when left unattended:

| Need       | Decay / hour | Low threshold | Critical threshold |
|------------|-------------|---------------|--------------------|
| hunger     | 3           | 35            | 15                 |
| energy     | 2           | 30            | 10                 |
| happiness  | 2.5         | 30            | 12                 |
| hygiene    | 1           | 25            | 10                 |
| curiosity  | 2           | 30            | 12                 |
| affection  | 3           | 35            | 15                 |

The overall **mood** is a weighted average of all needs, reported as a score
(0–100) and a level: `great`, `good`, `okay`, `low`, or `critical`.

### Example session

```bash
# Check on Pip
curl -H "Authorization: Bearer changeme" http://localhost:3000/api/pet

# Feed Pip
curl -X POST -H "Authorization: Bearer changeme" http://localhost:3000/api/actions/feed

# Cuddle Pip
curl -X POST -H "Authorization: Bearer changeme" http://localhost:3000/api/actions/pet
```

## Testing

```bash
npm test
```

Runs unit and integration tests with [Vitest](https://vitest.dev/). Tests
cover the needs system, decay engine, mood calculation, database layer, API
endpoints, and authentication.

## Project structure

```
src/
├── index.ts              Entry point
├── config.ts             Environment configuration
├── auth.ts               Owner password middleware
├── server.ts             Express app factory
├── pet/
│   ├── personality.ts    Pip's character sheet
│   ├── needs.ts          Need definitions and decay config
│   ├── actions.ts        Care action definitions
│   ├── mood.ts           Mood scoring and thresholds
│   └── state.ts          State engine (decay + action logic)
├── db/
│   └── database.ts       SQLite schema, migrations, queries
└── routes/
    ├── pet.ts            GET /api/pet endpoints
    └── actions.ts        POST /api/actions endpoints
tests/
├── needs.test.ts
├── state.test.ts
├── mood.test.ts
├── db.test.ts
└── api.test.ts
```

## Architecture notes (future phases)

The codebase is structured so later phases can extend without rewriting:

- **Phase 2 (LLM chat):** `personality.ts` provides the character sheet for
  prompt injection. Mood and flagged needs give context. Add a `/api/chat`
  route.
- **Phase 3 (Sprites):** `mood.level` drives animation selection. The API
  already returns everything a front end needs.
- **Phase 4 (Daily loop):** Action cooldowns and `flaggedNeeds` support
  notification triggers. `action_log` tracks usage patterns.

## License

MIT
