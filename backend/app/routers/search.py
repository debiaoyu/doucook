from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import SearchResult, RecipeListItem
from ..services import recipe_service

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResult)
def search(
    query: str = Query(..., min_length=1),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    results, total = recipe_service.search_recipes(
        db, query=query, category=category,
        page=page, page_size=page_size,
    )
    return SearchResult(
        results=results,
        total=total,
        page=page,
        page_size=page_size,
    )
