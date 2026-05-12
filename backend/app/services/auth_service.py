import os
from typing import Optional
from .douyin_service import DouyinService


def check_login_status() -> dict:
    cookies_file = os.environ.get("DOUSUB_COOKIES_FILE")
    if not cookies_file or not os.path.exists(cookies_file):
        return {}
    try:
        service = DouyinService(cookies_file=cookies_file)
        if not service.check_login():
            return {}
        try:
            from dousub.core.downloader import fetch_user_info
            info = fetch_user_info(cookies_file)
            if info:
                return {
                    "avatar_url": getattr(info, "avatar_url", None),
                    "nickname": getattr(info, "nickname", None),
                }
        except Exception:
            pass
        return {}
    except Exception:
        return {}
