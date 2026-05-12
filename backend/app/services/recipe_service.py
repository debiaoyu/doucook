import os
import shutil
import hashlib
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

from ..models import Recipe, Category, ImportLog
from ..schemas import RecipeUpdate
from .douyin_service import DouyinService


DATA_DIR = os.environ.get("DOUCOOK_DATA_DIR") or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
VIDEO_DIR = os.path.join(DATA_DIR, "videos")
THUMB_DIR = os.path.join(DATA_DIR, "thumbnails")

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)


def _get_video_hash(filepath: str) -> Optional[str]:
    try:
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None


def _ensure_categories(db: Session, names: list[str]) -> list[Category]:
    cats = []
    for name in names:
        cat = db.query(Category).filter(Category.name == name).first()
        if not cat:
            cat = Category(name=name)
            db.add(cat)
            db.flush()
        cats.append(cat)
    return cats


def _parse_tags(tags_str: Optional[str]) -> list[str]:
    if not tags_str:
        return []
    return [t.strip() for t in tags_str.split(",") if t.strip()]


COOKING_TAG_KEYWORDS = [
    ("川菜", ["川菜", "麻辣", "花椒", "辣椒", "宫保鸡丁", "麻婆豆腐", "水煮"]),
    ("湘菜", ["湘菜", "剁椒", "腊肉", "臭豆腐"]),
    ("粤菜", ["粤菜", "广东", "叉烧", "烧鹅", "白切鸡", "清蒸", "煲汤"]),
    ("鲁菜", ["鲁菜", "山东", "葱烧", "糖醋"]),
    ("甜品", ["甜品", "甜点", "蛋糕", "面包", "烘焙", "奶油", "巧克力", "布丁", "冰淇淋"]),
    ("面点", ["面条", "面点", "馒头", "饺子", "包子", "馄饨", "拉面", "擀面"]),
    ("汤羹", ["汤", "羹", "炖汤", "煲汤"]),
    ("凉菜", ["凉拌", "凉菜", "沙拉"]),
    ("小吃", ["小吃", "街头", "夜市", "烧烤", "炸串", "煎饼"]),
    ("家常菜", ["家常", "快手", "简单", "下饭"]),
    ("素食", ["素菜", "素食", "豆腐", "蔬菜", "青菜"]),
    ("荤菜", ["肉", "排骨", "鸡腿", "牛肉", "猪肉", "羊肉", "五花肉"]),
]


def _keyword_tags(title: str, recipe_text: Optional[str]) -> list[str]:
    text = f"{title} {recipe_text or ''}".lower()
    tags = []
    for tag_name, keywords in COOKING_TAG_KEYWORDS:
        if any(kw in text for kw in keywords):
            if tag_name not in tags:
                tags.append(tag_name)
    return tags


def _generate_tags_from_ai(service: DouyinService, url: str, title: str, recipe_text: Optional[str]) -> Optional[str]:
    try:
        prompt = "请为这个菜谱生成3-5个中文标签，用逗号分隔，例如：川菜, 鸡肉, 辣, 快手菜。只返回标签，不要其他文字。"
        answer = service.client.get_ai_summary(url, keyword=prompt)
        if answer and answer != "__LOGIN_REQUIRED__":
            tags = [t.strip() for t in answer.split(",") if t.strip()]
            if tags:
                return ",".join(tags[:8])
    except Exception:
        pass
    return None


def import_from_url(
    db: Session,
    url: str,
    cookies_file: Optional[str] = None,
) -> dict:
    service = DouyinService(cookies_file=cookies_file)

    resolved_url = service.resolve_url(url)
    existing = db.query(Recipe).filter(Recipe.douyin_url == resolved_url).first()
    if existing:
        log = ImportLog(
            url=url,
            title=existing.title,
            source="douyin",
            status="duplicate",
            message=f"重复视频: {existing.title}",
        )
        db.add(log)
        db.commit()
        return {"duplicate": True, "existing_id": existing.id, "resolved_url": resolved_url}

    result = service.detect_and_download(url, VIDEO_DIR, cookies_file)

    log = ImportLog(
        url=url,
        title=result.get("title"),
        source="douyin",
        status="success" if result.get("is_cooking") else "skipped",
        message=result.get("message", ""),
    )

    if not result.get("is_cooking"):
        db.add(log)
        db.commit()
        return result

    video_path = result.get("video_path")
    file_hash = _get_video_hash(video_path) if video_path else None

    existing = None
    if file_hash:
        existing = db.query(Recipe).filter(Recipe.file_hash == file_hash).first()

    if existing:
        log.status = "duplicate"
        log.message = f"重复视频: {existing.title}"
        db.add(log)
        db.commit()
        return {**result, "duplicate": True, "existing_id": existing.id}

    title = result.get("title") or "未命名菜谱"
    resolved_url = result.get("resolved_url")
    ai_summary = result.get("ai_summary")
    recipe_text = result.get("recipe_text")

    tags = None
    if resolved_url and title:
        ai_tags = _generate_tags_from_ai(service, resolved_url, title, recipe_text)
        if ai_tags:
            tags = ai_tags
        else:
            keyword_tags = _keyword_tags(title, recipe_text or ai_summary)
            if keyword_tags:
                tags = ",".join(keyword_tags)

    recipe = Recipe(
        title=title,
        douyin_url=resolved_url,
        source="douyin",
        video_path=video_path,
        is_cooking=True,
        confidence=result.get("confidence"),
        ai_summary=ai_summary,
        recipe_text=recipe_text,
        tags=tags,
        file_hash=file_hash,
    )

    db.add(recipe)
    db.add(log)
    db.commit()
    db.refresh(recipe)

    return {**result, "duplicate": False, "recipe_id": recipe.id, "tags": tags, "file_hash": file_hash}


def import_manual(
    db: Session,
    title: str,
    url: Optional[str] = None,
    recipe_text: Optional[str] = None,
    notes: Optional[str] = None,
    categories: Optional[list[str]] = None,
) -> Recipe:
    keyword_tags = _keyword_tags(title, recipe_text)
    tags = ",".join(keyword_tags) if keyword_tags else None

    recipe = Recipe(
        title=title,
        douyin_url=url,
        source="manual",
        recipe_text=recipe_text,
        notes=notes,
        tags=tags,
        is_cooking=True,
    )
    if categories:
        recipe.categories = _ensure_categories(db, categories)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


def update_recipe(db: Session, recipe_id: int, update: RecipeUpdate) -> Optional[Recipe]:
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        return None
    if update.title is not None:
        recipe.title = update.title
    if update.notes is not None:
        recipe.notes = update.notes
    if update.recipe_text is not None:
        recipe.recipe_text = update.recipe_text
    if update.tags is not None:
        recipe.tags = update.tags
    if update.categories is not None:
        recipe.categories = _ensure_categories(db, update.categories)
    db.commit()
    db.refresh(recipe)
    return recipe


def delete_recipe(db: Session, recipe_id: int) -> bool:
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        return False
    if recipe.video_path and os.path.exists(recipe.video_path):
        try:
            os.remove(recipe.video_path)
        except OSError:
            pass
    db.delete(recipe)
    db.commit()
    return True


def get_recipe(db: Session, recipe_id: int) -> Optional[Recipe]:
    return db.query(Recipe).filter(Recipe.id == recipe_id).first()


def list_recipes(
    db: Session,
    category: Optional[str] = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Recipe], int]:
    query = db.query(Recipe)
    if category:
        query = query.join(Recipe.categories).filter(Category.name == category)
    if order == "desc":
        query = query.order_by(getattr(Recipe, sort).desc())
    else:
        query = query.order_by(getattr(Recipe, sort))
    total = query.count()
    recipes = query.offset((page - 1) * page_size).limit(page_size).all()
    return recipes, total


def search_recipes(
    db: Session,
    query: str,
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Recipe], int]:
    q = db.query(Recipe)
    if category:
        q = q.join(Recipe.categories).filter(Category.name == category)
    like = f"%{query}%"
    q = q.filter(
        Recipe.title.ilike(like)
        | Recipe.recipe_text.ilike(like)
        | Recipe.ai_summary.ilike(like)
        | Recipe.notes.ilike(like)
        | Recipe.tags.ilike(like)
    )
    total = q.count()
    recipes = q.offset((page - 1) * page_size).limit(page_size).all()
    return recipes, total
