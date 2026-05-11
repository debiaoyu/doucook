import os
import shutil
import hashlib
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

from ..models import Recipe, Category, ImportLog
from ..schemas import RecipeUpdate
from .douyin_service import DouyinService


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
VIDEO_DIR = os.path.join(DATA_DIR, "videos")
THUMB_DIR = os.path.join(DATA_DIR, "thumbnails")


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


def import_from_url(
    db: Session,
    url: str,
    cookies_file: Optional[str] = None,
) -> dict:
    service = DouyinService(cookies_file=cookies_file)
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
    if result.get("resolved_url"):
        existing = db.query(Recipe).filter(Recipe.douyin_url == result["resolved_url"]).first()
    if not existing and file_hash:
        existing = db.query(Recipe).filter(Recipe.file_hash == file_hash).first()

    if existing:
        log.status = "duplicate"
        log.message = f"重复视频: {existing.title}"
        db.add(log)
        db.commit()
        return {**result, "duplicate": True, "existing_id": existing.id}

    recipe = Recipe(
        title=result.get("title") or "未命名菜谱",
        douyin_url=result.get("resolved_url"),
        source="douyin",
        video_path=video_path,
        is_cooking=True,
        confidence=result.get("confidence"),
        ai_summary=result.get("ai_summary"),
        recipe_text=result.get("recipe_text"),
        file_hash=file_hash,
    )

    cats = _ensure_categories(db, ["抖音菜谱"])
    recipe.categories = cats

    db.add(recipe)
    db.add(log)
    db.commit()
    db.refresh(recipe)

    return {**result, "duplicate": False, "recipe_id": recipe.id}


def import_manual(
    db: Session,
    title: str,
    url: Optional[str] = None,
    recipe_text: Optional[str] = None,
    notes: Optional[str] = None,
    categories: Optional[list[str]] = None,
) -> Recipe:
    recipe = Recipe(
        title=title,
        douyin_url=url,
        source="manual",
        recipe_text=recipe_text,
        notes=notes,
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
    )
    total = q.count()
    recipes = q.offset((page - 1) * page_size).limit(page_size).all()
    return recipes, total
