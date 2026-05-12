import os
import uuid
import threading
from fastapi import APIRouter, HTTPException
from ..schemas import LoginStartResponse, LoginStatusResponse, LoginCheckResponse
from ..services.douyin_service import DouyinService
from ..services.auth_service import check_login_status

router = APIRouter(prefix="/api/auth", tags=["auth"])

_login_tasks: dict[str, dict] = {}
_tasks_lock = threading.Lock()


@router.get("/status", response_model=LoginCheckResponse)
def auth_status():
    cookies_file = os.environ.get("DOUSUB_COOKIES_FILE", "")
    info = check_login_status()
    return LoginCheckResponse(
        logged_in=bool(info),
        cookies_file=cookies_file or "",
        avatar_url=info.get("avatar_url"),
        nickname=info.get("nickname"),
    )


@router.post("/login", response_model=LoginStartResponse)
def start_login():
    login_id = str(uuid.uuid4())
    with _tasks_lock:
        _login_tasks[login_id] = {"status": "pending"}
    return LoginStartResponse(login_id=login_id, status="pending")


@router.get("/login/{login_id}", response_model=LoginStatusResponse)
def poll_login(login_id: str):
    with _tasks_lock:
        task = _login_tasks.get(login_id)
    if not task:
        raise HTTPException(status_code=404, detail="Login task not found")
    return LoginStatusResponse(
        status=task.get("status", "pending"),
        qr_code=task.get("qr_code"),
        message=task.get("message", ""),
        cookies_file=task.get("cookies_file"),
        avatar_url=task.get("avatar_url"),
        nickname=task.get("nickname"),
    )
