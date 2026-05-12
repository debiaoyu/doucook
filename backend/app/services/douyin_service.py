import os
import re
import hashlib
from pathlib import Path
from typing import Optional

from dousub import DouyinClient
from dousub.core.downloader import get_ai_summary
from dousub.exceptions import DousubError, LoginRequiredError


COOKING_KEYWORDS = [
    "做饭", "烹饪", "菜谱", "食谱", "美食", "料理", "下厨", "炒菜",
    "炖", "煮", "煎", "炸", "蒸", "烤", "红烧", "凉拌",
    "厨房", "食材", "调料", "家常菜", "教程", "厨房技巧",
    "烘焙", "甜点", "面点", "汤", "羹",
    "做法", "自制", "制作", "美味", "配方",
]


def is_cooking_related(text: str) -> tuple[bool, float]:
    if not text:
        return False, 0.0
    text_lower = text.lower()
    matches = sum(1 for kw in COOKING_KEYWORDS if kw in text_lower)
    if matches == 0:
        return False, 0.0
    confidence = min(matches / 3.0, 0.99)
    return True, confidence


def extract_recipe_from_summary(summary: str) -> Optional[str]:
    if not summary:
        return None
    lines = summary.split("\n")
    steps = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r"^\d+[\.、]", line):
            steps.append(line)
        elif any(kw in line for kw in ["步骤", "做法", "教程", "食材", "用料", "调料", "材料"]):
            steps.append(line)
        elif re.match(r"^[一二三四五六七八九十]+[、.]", line):
            steps.append(line)
    if steps:
        return "\n".join(steps)
    if len(summary) > 50:
        return summary
    return None


_env_data = os.environ.get("DOUCOOK_DATA_DIR")
if _env_data:
    PROJECT_ROOT = _env_data
else:
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def _resolve_path(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    if os.path.isabs(path):
        return path
    return os.path.join(PROJECT_ROOT, path)


class DouyinService:
    def __init__(self, cookies_file: Optional[str] = None):
        self.cookies_file = _resolve_path(cookies_file or os.environ.get("DOUSUB_COOKIES_FILE"))
        self.client = DouyinClient(cookies_file=self.cookies_file)

    def resolve_url(self, url: str) -> str:
        return self.client.resolve_url(url)

    def detect_and_download(
        self, url: str, output_dir: str, cookies_file: Optional[str] = None
    ) -> dict:
        cf = _resolve_path(cookies_file) or self.cookies_file
        client = DouyinClient(cookies_file=cf)

        resolved_url = client.resolve_url(url)
        os.makedirs(output_dir, exist_ok=True)
        DETECT_PROMPT = "这个视频是做饭、烹饪、美食教程吗？请只回答是或否"
        answer = client.get_ai_summary(resolved_url, keyword=DETECT_PROMPT)
        is_cooking = answer and "是" in answer
        confidence = 0.95 if is_cooking else 0.0

        if answer == "__LOGIN_REQUIRED__":
            return {
                "is_cooking": False,
                "confidence": 0.0,
                "ai_summary": None,
                "title": None,
                "video_path": None,
                "recipe_text": None,
                "resolved_url": resolved_url,
                "message": "抖音登录已过期，请在设置页重新扫码登录",
            }

        if not is_cooking:
            return {
                "is_cooking": False,
                "confidence": confidence,
                "ai_summary": answer,
                "title": None,
                "video_path": None,
                "recipe_text": None,
                "resolved_url": resolved_url,
                "message": f"非做饭视频 (answer={answer})",
            }

        url_hash = hashlib.sha256(resolved_url.encode()).hexdigest()[:16]
        subdir = Path(output_dir) / url_hash
        subdir.mkdir(parents=True, exist_ok=True)

        video_path, info = client.download_video(
            resolved_url, output_path=subdir, ai_summary=True
        )

        recipe_text = extract_recipe_from_summary(info.get("ai_summary") or "")

        return {
            "is_cooking": True,
            "confidence": confidence,
            "ai_summary": info.get("ai_summary"),
            "title": info.get("title", ""),
            "video_path": str(video_path) if video_path else None,
            "recipe_text": recipe_text,
            "resolved_url": resolved_url,
            "chapters": info.get("chapters"),
            "message": "导入成功",
        }

    def ask_question(self, url: str, question: str, cookies_file: Optional[str] = None) -> Optional[str]:
        cf = _resolve_path(cookies_file) or self.cookies_file
        try:
            result = get_ai_summary(url, keyword=question, cookies_file=cf)
            if result == "__LOGIN_REQUIRED__":
                return None
            return result
        except Exception:
            return None

    def login(
        self,
        qr_code_image: Optional[str] = None,
        timeout: int = 120,
        status_callback=None,
    ) -> bool:
        cf = self.cookies_file
        client = DouyinClient(cookies_file=cf)
        return client.login(
            qr_code_image=qr_code_image,
            timeout=timeout,
            status_callback=status_callback,
        )

    def check_login(self) -> bool:
        return self.client.check_login()

    def get_favorites(self, cookies_file: Optional[str] = None) -> list[dict]:
        cf = _resolve_path(cookies_file) or self.cookies_file
        client = DouyinClient(cookies_file=cf)
        return client.get_favorites()

    def get_likes(self, cookies_file: Optional[str] = None) -> list[dict]:
        cf = _resolve_path(cookies_file) or self.cookies_file
        client = DouyinClient(cookies_file=cf)
        return client.get_likes()
