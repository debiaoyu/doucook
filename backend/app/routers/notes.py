from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import recipe_service

router = APIRouter(prefix="/api/notes", tags=["notes"])


class NotesUpdate(BaseModel):
    notes: str


@router.put("/{recipe_id}")
def update_notes(recipe_id: int, data: NotesUpdate, db: Session = Depends(get_db)):
    recipe = recipe_service.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    recipe.notes = data.notes
    db.commit()
    return {"message": "保存成功", "notes": data.notes}


@router.get("/{recipe_id}")
def get_notes(recipe_id: int, db: Session = Depends(get_db)):
    recipe = recipe_service.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return {"notes": recipe.notes or ""}
