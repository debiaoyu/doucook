import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, get_db
from .models import Recipe, Category, QAPair, ImportLog
from .routers import recipes, import_routes, search, notes, ai, settings, video, auth
from .settings_store import load_settings

_env_data = os.environ.get("DOUCOOK_DATA_DIR")
if _env_data:
    DATA_DIR = Path(_env_data)
else:
    PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
    DATA_DIR = PROJECT_ROOT / "data"
STATIC_DIR = DATA_DIR.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / "videos").mkdir(exist_ok=True)
    (DATA_DIR / "thumbnails").mkdir(exist_ok=True)
    Base.metadata.create_all(bind=engine)
    saved = load_settings()
    if saved.get("cookies_file"):
        os.environ["DOUSUB_COOKIES_FILE"] = saved["cookies_file"]
    yield


app = FastAPI(title="doucook", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes.router)
app.include_router(import_routes.router)
app.include_router(search.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(settings.router)
app.include_router(video.router)
app.include_router(auth.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("DOUCOOK_BACKEND_PORT", os.environ.get("DOUCOOK_PORT", "8899")))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
