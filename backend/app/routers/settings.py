import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category
from ..schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return SettingsOut(
        cookies_file=os.environ.get("DOUSUB_COOKIES_FILE"),
        data_dir=DATA_DIR,
        categories=categories,
    )


@router.put("", response_model=SettingsOut)
def update_settings(update: SettingsUpdate, db: Session = Depends(get_db)):
    if update.cookies_file:
        os.environ["DOUSUB_COOKIES_FILE"] = update.cookies_file
    categories = db.query(Category).all()
    return SettingsOut(
        cookies_file=os.environ.get("DOUSUB_COOKIES_FILE"),
        data_dir=DATA_DIR,
        categories=categories,
    )
