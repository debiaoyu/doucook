import os
from typing import Optional
from .douyin_service import DouyinService


def check_login_status() -> dict:
    cookies_file = os.environ.get("DOUSUB_COOKIES_FILE")
    if not cookies_file or not os.path.exists(cookies_file):
        return {}
    service = DouyinService(cookies_file=cookies_file)
    if not service.check_login():
        return {}
    return {
        "avatar_url": None,
        "nickname": None,
    }
