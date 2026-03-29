# Music Recommendation System

Production-style monorepo: **React + Vite** frontend, **Flask** API with an app factory, **MongoDB** for users/favorites, and a **content-based recommender** (TF-IDF + cosine similarity) over a CSV catalog.

## Repository structure

| Path | Role |
|------|------|
| `backend/` | Flask API (`app` package), Gunicorn `wsgi:app`, tests |
| `frontend/` | React SPA, env-driven API base URL |
| `docs/` | Architecture notes |
| `docker-compose.yml` | MongoDB + API for local integration |

## Prerequisites

- Python 3.12+ (backend)
- Node 20+ (frontend)
- MongoDB (local, Docker, or Atlas)
- `dataset.csv` in `backend/` (Spotify tracks dataset used by the engine)

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # edit secrets and Mongo URI
python run.py                   # http://localhost:5000
```

**Production-style serve (Gunicorn):**

```bash
set FLASK_ENV=production
set JWT_SECRET_KEY=your-long-random-secret
gunicorn --bind 0.0.0.0:5000 --workers 2 --threads 4 --timeout 120 wsgi:app
```

**Health check:** `GET http://localhost:5000/health`

**Tests:**

```bash
cd backend
pip install pytest
pytest tests/ -q
```

## Frontend setup

```bash
cd frontend
npm install
copy .env.example .env          # set VITE_BACKEND_URL to your API
npm run dev
```

**Production build:** `npm run build` → static assets in `frontend/dist/` (serve behind nginx, Netlify, Vercel, etc.).

## Docker

**API + MongoDB:**

```bash
docker compose up --build
```

Point the frontend at `http://localhost:5000` (or the host/port you publish). For the **frontend image**, pass the API URL at build time:

```bash
docker build -f frontend/Dockerfile --build-arg VITE_BACKEND_URL=https://api.example.com ./frontend
```

## Environment variables

- **Backend** — see `backend/.env.example` (`JWT_SECRET_KEY`, `MONGO_URI`, `CORS_ORIGINS`, `DATASET_PATH`, optional Spotify/YouTube keys).
- **Frontend** — `VITE_BACKEND_URL` only (public).

## API surface (summary)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/recommend` | No |
| POST | `/search` | No |
| POST | `/api/register` | No |
| POST | `/api/login` | No |
| GET/POST/DELETE | `/api/favorites` | JWT |

## License / attribution

Project structure and deployment patterns are suitable for portfolios and internships; replace placeholder links in marketing pages with your own deployment URLs.
