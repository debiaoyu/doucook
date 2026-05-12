import os
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import SettingsOut, SettingsUpdate
from ..services.auth_service import check_login_status

router = APIRouter(prefix="/api/settings", tags=["settings"])

PROJECT_ROOT = os.environ.get("DOUCOOK_DATA_DIR") or os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = PROJECT_ROOT if os.environ.get("DOUCOOK_DATA_DIR") else os.path.join(PROJECT_ROOT, "data")


def _resolve_cookies_file(cookies_file: Optional[str]) -> Optional[str]:
    if not cookies_file:
        return None
    if os.path.isabs(cookies_file):
        return cookies_file
    return os.path.join(PROJECT_ROOT, cookies_file)


def _check_cookies_valid(cookies_file: Optional[str]) -> bool:
    resolved = _resolve_cookies_file(cookies_file)
    if not resolved or not os.path.exists(resolved):
        return False
    try:
        from dousub.core.downloader import fetch_user_info
        result = fetch_user_info(resolved)
        return result is not None
    except Exception:
        return False


def _build_settings():
    cookies_file = _resolve_cookies_file(os.environ.get("DOUSUB_COOKIES_FILE"))
    try:
        login_info = check_login_status()
    except Exception:
        login_info = {}
    return SettingsOut(
        cookies_file=cookies_file,
        data_dir=DATA_DIR,
        cookies_valid=_check_cookies_valid(cookies_file),
        avatar_url=login_info.get("avatar_url"),
        nickname=login_info.get("nickname"),
    )


@router.get("", response_model=SettingsOut)
def get_settings():
    return _build_settings()


@router.put("", response_model=SettingsOut)
def update_settings(update: SettingsUpdate):
    if update.cookies_file is not None:
        os.environ["DOUSUB_COOKIES_FILE"] = _resolve_cookies_file(update.cookies_file)
    elif update.cookies_file is None and "DOUSUB_COOKIES_FILE" in os.environ:
        del os.environ["DOUSUB_COOKIES_FILE"]
    return _build_settings()


@router.post("/cookies", response_model=SettingsOut)
async def upload_cookies(file: UploadFile = File(...)):
    os.makedirs(DATA_DIR, exist_ok=True)
    dest = os.path.join(DATA_DIR, "dousub_cookies.txt")
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    os.environ["DOUSUB_COOKIES_FILE"] = dest
    return _build_settings()
