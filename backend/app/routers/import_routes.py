from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ImportURLInput, ImportManualInput, ImportBatchInput
from ..services import recipe_service
from ..services.douyin_service import DouyinService

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/url")
def import_from_url(input_data: ImportURLInput, db: Session = Depends(get_db)):
    try:
        result = recipe_service.import_from_url(
            db, url=input_data.url, cookies_file=input_data.cookies_file
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/manual")
def import_manual(input_data: ImportManualInput, db: Session = Depends(get_db)):
    try:
        recipe = recipe_service.import_manual(
            db,
            title=input_data.title,
            url=input_data.url,
            recipe_text=input_data.recipe_text,
            notes=input_data.notes,
            categories=input_data.categories,
        )
        return {"recipe_id": recipe.id, "title": recipe.title, "message": "导入成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
def batch_import(input_data: ImportBatchInput, db: Session = Depends(get_db)):
    try:
        service = DouyinService(cookies_file=input_data.cookies_file)
        if input_data.source == "favorites":
            videos = service.get_favorites()
        elif input_data.source == "likes":
            videos = service.get_likes()
        else:
            raise HTTPException(status_code=400, detail="无效的来源")

        results = []
        for video in videos:
            url = video.get("url", "")
            if not url:
                continue
            try:
                result = recipe_service.import_from_url(
                    db, url=url, cookies_file=input_data.cookies_file
                )
                results.append(result)
            except Exception as e:
                results.append({"url": url, "error": str(e), "title": video.get("title")})

        return {"total": len(videos), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
