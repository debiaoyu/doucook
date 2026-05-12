import os
import uuid
import threading
import tempfile
import base64
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
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    qr_path = tmp.name
    tmp.close()
    os.environ["DOUCOOK_QR_PATH"] = qr_path

    with _tasks_lock:
        _login_tasks[login_id] = {"status": "pending", "message": "", "qr_path": qr_path}

    def _do_login():
        try:
            with _tasks_lock:
                task = _login_tasks.get(login_id)
                if task:
                    task["message"] = "启动中..."

            cookies_file = os.environ.get("DOUSUB_COOKIES_FILE")
            service = DouyinService(cookies_file=cookies_file)

            def status_callback(msg):
                with _tasks_lock:
                    task = _login_tasks.get(login_id)
                    if not task:
                        return
                    task["message"] = msg
                    if "等待扫码" in msg:
                        try:
                            with open(qr_path, "rb") as f:
                                b64 = base64.b64encode(f.read()).decode("utf-8")
                            task["qr_code"] = b64
                        except Exception:
                            pass
                        task["status"] = "waiting_scan"
                    elif "获取二维码" in msg:
                        task["status"] = "pending"

            result = service.login(
                qr_code_image=qr_path,
                timeout=120,
                status_callback=status_callback,
            )

            with _tasks_lock:
                task = _login_tasks.get(login_id)
                if not task:
                    return
                if result:
                    task["status"] = "success"
                    task["message"] = "登录成功"
                    task["avatar_url"] = result.get("avatar", "")
                    task["nickname"] = result.get("nickname", "")
                    if service.cookies_file:
                        os.environ["DOUSUB_COOKIES_FILE"] = service.cookies_file
                else:
                    task["status"] = "timeout"
                    task["message"] = "登录超时或失败"
        except Exception as e:
            import traceback
            traceback.print_exc()
            with _tasks_lock:
                task = _login_tasks.get(login_id)
                if task:
                    task["status"] = "error"
                    task["message"] = f"登录失败: {e}"
        finally:
            try:
                os.unlink(qr_path)
            except Exception:
                pass

    thread = threading.Thread(target=_do_login, daemon=True)
    thread.start()

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


@router.post("/login/{login_id}/cancel")
def cancel_login(login_id: str):
    with _tasks_lock:
        task = _login_tasks.get(login_id)
        if task:
            task["status"] = "cancelled"
            task["message"] = "已取消"
    return {"ok": True}
