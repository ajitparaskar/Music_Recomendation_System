# Architecture

## Overview

Monorepo with a **React (Vite) SPA** and a **Flask REST API**. The recommendation engine is content-based (TF-IDF + cosine similarity) over a local CSV dataset. **MongoDB** stores users and favorites. Optional **Spotify** and **YouTube** APIs enrich tracks with metadata and embeddable video IDs.

## Repository layout

```
├── backend/                 # Flask application
│   ├── app/
│   │   ├── __init__.py      # create_app() factory
│   │   ├── config.py        # environments & env vars
│   │   ├── extensions.py    # JWT
│   │   ├── db.py            # Mongo accessor
│   │   ├── errors.py        # JSON error handlers
│   │   ├── blueprints/      # HTTP routes (health, music, auth)
│   │   └── services/        # recommendation engine, YouTube client
│   ├── tests/               # pytest
│   ├── scripts/             # CLI utilities
│   ├── wsgi.py              # Gunicorn entry
│   └── run.py               # Dev server
├── frontend/                # Vite + React
│   └── src/
│       ├── api/             # API URL helpers
│       ├── config/          # VITE_* env
│       ├── context/         # React context (auth)
│       └── components/
│           ├── layout/      # Shell (navbar)
│           ├── music/       # Search, recommendations, player, favorites
│           ├── auth/        # Login / register
│           └── pages/       # Marketing pages
├── docker-compose.yml       # Mongo + API (optional)
└── docs/
```

## Request flow

1. Browser loads the SPA from a static host (Vercel, Netlify, nginx, etc.).
2. The SPA calls the API using `VITE_BACKEND_URL` (recommendations, search, auth, favorites).
3. Protected routes send `Authorization: Bearer <JWT>`.

## Scaling notes

- **API**: Run multiple Gunicorn workers; keep JWT secret stable across processes.
- **Dataset**: Loaded once per process at startup (large CSV). For very large catalogs, consider a precomputed index or external vector store.
- **MongoDB**: Use a managed cluster (Atlas) in production; set `MONGO_URI` accordingly.

## Health checks

`GET /health` returns JSON suitable for load balancers and uptime monitors.
