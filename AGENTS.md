# doucook

Cooking recipe manager that imports videos from Douyin (抖音).

## Run

```bash
# Terminal 1 — backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install
npm run dev          # Vite on :3000, proxies /api → backend port
npm run build        # tsc -b && vite build → frontend/dist/
```

Backend serves `frontend/dist/` as static when present (production mode).

## Port Auto-Fallback

If port 8000 is occupied, both `start.bat` and `dev.sh` auto-detect the first available port in 8000–8010. Set `DOUCOOK_BACKEND_PORT` env var to force a specific port (e.g. `set DOUCOOK_BACKEND_PORT=9000` on Windows, or `export DOUCOOK_BACKEND_PORT=9000` on Linux/macOS). The frontend Vite proxy reads this env var to stay in sync.

## Architecture

```
backend/   — FastAPI + SQLAlchemy + SQLite  (app/main.py)
  routers/ — 7 modules: recipes, import_routes, search, notes, ai, settings, video
  services/ — recipe_service.py (CRUD), douyin_service.py (dousub wrapper)
frontend/  — React 18 + TypeScript + Vite + AntDesign zh_CN
  src/
    theme.ts          — design tokens (colors, spacing, borderRadius)
    api/index.ts      — typed Axios client for all /api endpoints
    components/AppLayout.tsx — sidebar + header + Outlet shell
    pages/            — 5 pages: Dashboard, RecipeList, RecipeDetail, ImportPage, SettingsPage
data/      — doucook.db, videos/, thumbnails/ (auto-created)
```

## Routes & Pages

| Path | Component | Description |
|---|---|---|
| `/` | Dashboard | stats cards, recent recipes, quick actions |
| `/recipes` | RecipeList | grid/list with category filter, sort, search |
| `/recipes/:id` | RecipeDetail | video + info + tabs (recipe/AI/Q&A/notes) |
| `/import` | ImportPage | card tabs: URL import, batch import, 文字菜谱 |
| `/import?tab=batch` | | batch tab shortcut from Dashboard |
| `/settings` | SettingsPage | stats, storage, cookies config, category mgmt |

## API Endpoints (all prefixed `/api`)

| Prefix | Endpoints |
|---|---|
| `/api/recipes` | GET list, GET count, GET/PATCH/DELETE `/:id`, GET/POST/DELETE `/categories/*` |
| `/api/import` | POST `/url`, `/manual`, `/batch` |
| `/api/search` | GET `?query=&category=&page=&page_size=` |
| `/api/notes` | GET/PUT `/:id` |
| `/api/ai` | POST `/ask/:id`, GET `/qa/:id` |
| `/api/settings` | GET/PUT |
| `/api/video` | GET `/:path` (raw FileResponse) |
| `/api/health` | GET health check |

## Key Details

- **Design tokens**: colors, spacing, borderRadius in `frontend/src/theme.ts`
- **Theme**: Ant Design `ConfigProvider` with `#e67e22` orange primary in `main.tsx`
- **All UI in Chinese** (antd locale zh_CN, hardcoded strings)
- **No state management** — component-local `useState`/`useEffect` only
- **No CSS modules** — all styling is `style={{}}` inline objects
- **CORS wide open** (`allow_origins=["*"]`)
- **Video playback**: served via Vite proxy at `/api/video/${path}` (relative URL)
- **Cookies**: set via `DOUSUB_COOKIES_FILE` env var or Settings PUT endpoint
- **Video storage**: `data/videos/`, thumbnails in `data/thumbnails/`
- **Duplicate detection**: `file_hash` column on Recipe model, set during import
- **No tests, no lint, no typecheck, no CI/CD, no Docker, no formatter config** in this repo
