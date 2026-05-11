from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Recipe, Category
from ..schemas import (
    RecipeOut, RecipeListItem, RecipeUpdate,
    CategoryCreate, CategoryOut,
)
from ..services import recipe_service

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("", response_model=list[RecipeListItem])
def list_recipes(
    category: Optional[str] = Query(None),
    sort: str = Query("created_at"),
    order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    recipes, _ = recipe_service.list_recipes(
        db, category=category, sort=sort, order=order,
        page=page, page_size=page_size,
    )
    return recipes


@router.get("/count", response_model=dict)
def count_recipes(db: Session = Depends(get_db)):
    total = db.query(Recipe).count()
    cooking = db.query(Recipe).filter(Recipe.is_cooking == True).count()
    return {"total": total, "cooking": cooking}


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = recipe_service.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return recipe


@router.patch("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: int, update: RecipeUpdate, db: Session = Depends(get_db)):
    recipe = recipe_service.update_recipe(db, recipe_id, update)
    if not recipe:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return recipe


@router.delete("/{recipe_id}", response_model=dict)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    ok = recipe_service.delete_recipe(db, recipe_id)
    if not ok:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return {"message": "删除成功"}


@router.get("/categories/list", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.post("/categories", response_model=CategoryOut)
def create_category(cat: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == cat.name).first()
    if existing:
        return existing
    db_cat = Category(name=cat.name, color=cat.color)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


@router.delete("/categories/{category_id}", response_model=dict)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="分类不存在")
    db.delete(cat)
    db.commit()
    return {"message": "删除成功"}
