import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
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
    except HTTPException:
        raise
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
def batch_import(input_data: ImportBatchInput):
    if input_data.source not in ("favorites", "likes"):
        raise HTTPException(status_code=400, detail="无效的来源")

    def generate():
        db = SessionLocal()
        try:
            yield f"data: {json.dumps({'type': 'scanning'}, ensure_ascii=False)}\n\n"

            cookies_file = input_data.cookies_file or os.environ.get("DOUSUB_COOKIES_FILE")
            service = DouyinService(cookies_file=cookies_file)

            if input_data.source == "favorites":
                videos = service.get_favorites()
            else:
                videos = service.get_likes()

            total = len(videos)
            yield f"data: {json.dumps({'type': 'init', 'total': total}, ensure_ascii=False)}\n\n"

            results = []
            for i, video in enumerate(videos):
                url = video.get("url", "")
                title = video.get("title", "")

                progress_data = json.dumps({'type': 'progress', 'current': i + 1, 'total': total, 'title': title}, ensure_ascii=False)
                yield f"data: {progress_data}\n\n"

                if not url:
                    result = {"title": title, "error": "无效链接"}
                    results.append(result)
                    result_data = json.dumps({'type': 'result', 'result': result}, ensure_ascii=False)
                    yield f"data: {result_data}\n\n"
                    continue

                try:
                    result = recipe_service.import_from_url(
                        db, url=url, cookies_file=cookies_file
                    )
                    result["title"] = result.get("title") or title
                    results.append(result)
                except Exception as e:
                    result = {"title": title, "url": url, "error": str(e)}
                    results.append(result)

                result_data = json.dumps({'type': 'result', 'result': result}, ensure_ascii=False)
                yield f"data: {result_data}\n\n"

            complete_data = json.dumps({'type': 'complete', 'results': results}, ensure_ascii=False)
            yield f"data: {complete_data}\n\n"
        except Exception as e:
            error_data = json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)
            yield f"data: {error_data}\n\n"
        finally:
            db.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
