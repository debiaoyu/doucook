import os
import json
import uuid
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
from ..schemas import ImportURLInput, ImportManualInput, ImportBatchInput
from ..services import recipe_service
from ..services.douyin_service import DouyinService

router = APIRouter(prefix="/api/import", tags=["import"])

MAX_WORKERS = 3

_batch_tasks: dict[str, dict] = {}
_tasks_lock = threading.Lock()


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

    task_id = str(uuid.uuid4())
    event_queue: Queue = Queue()
    cancel_event = threading.Event()

    with _tasks_lock:
        _batch_tasks[task_id] = {
            "status": "starting",
            "total": 0,
            "completed": 0,
            "queue": event_queue,
            "cancel": cancel_event,
        }

    def worker():
        db = SessionLocal()
        try:
            event_queue.put({"type": "scanning", "task_id": task_id})
            cookies_file = input_data.cookies_file or os.environ.get("DOUSUB_COOKIES_FILE")
            service = DouyinService(cookies_file=cookies_file)

            if input_data.source == "favorites":
                videos = service.get_favorites()
            else:
                videos = service.get_likes()

            total = len(videos)
            with _tasks_lock:
                _batch_tasks[task_id]["total"] = total
                _batch_tasks[task_id]["status"] = "running"
            event_queue.put({"type": "init", "total": total, "task_id": task_id})

            seen_urls: set[str] = set()
            seen_hashes: set[str] = set()
            results: list[dict] = [None] * total

            def process_one(video: dict, idx: int) -> dict | None:
                if cancel_event.is_set():
                    return None
                url = video.get("url", "")
                title = video.get("title", "")
                event_queue.put({
                    "type": "progress",
                    "current": idx + 1,
                    "total": total,
                    "title": title or "",
                    "task_id": task_id,
                })
                if not url:
                    result = {"title": title, "error": "无效链接"}
                    return result
                if url in seen_urls:
                    return {"title": title, "url": url, "duplicate": True, "error": "重复视频（批次内）"}
                try:
                    result = recipe_service.import_from_url(db, url=url, cookies_file=cookies_file)
                    result["title"] = result.get("title") or title
                    with _tasks_lock:
                        if not result.get("duplicate") and result.get("file_hash"):
                            if result["file_hash"] in seen_hashes:
                                result["duplicate"] = True
                                result["error"] = "重复视频（批次内）"
                            else:
                                seen_hashes.add(result["file_hash"])
                    seen_urls.add(url)
                    return result
                except Exception as e:
                    return {"title": title, "url": url, "error": str(e)}

            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
                futures = {pool.submit(process_one, v, i): i for i, v in enumerate(videos)}
                for future in as_completed(futures):
                    idx = futures[future]
                    try:
                        result = future.result()
                        if result is not None:
                            results[idx] = result
                            event_queue.put({"type": "result", "result": result, "task_id": task_id})
                    except Exception as e:
                        results[idx] = {"error": str(e)}
                    completed = sum(1 for r in results if r is not None)
                    with _tasks_lock:
                        _batch_tasks[task_id]["completed"] = completed

            valid_results = [r for r in results if r is not None]
            event_queue.put({
                "type": "complete",
                "results": valid_results,
                "task_id": task_id,
            })
            with _tasks_lock:
                _batch_tasks[task_id]["status"] = "complete"
        except Exception as e:
            event_queue.put({"type": "error", "message": str(e), "task_id": task_id})
            with _tasks_lock:
                _batch_tasks[task_id]["status"] = "error"
        finally:
            db.close()
            event_queue.put(None)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    def generate():
        while True:
            try:
                event = event_queue.get(timeout=30)
            except Exception:
                yield f"data: {json.dumps({'type': 'ping'}, ensure_ascii=False)}\n\n"
                continue
            if event is None:
                break
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/batch/{task_id}/cancel")
def cancel_batch(task_id: str):
    with _tasks_lock:
        task = _batch_tasks.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        task["cancel"].set()
        task["status"] = "cancelled"
    return {"status": "cancelled"}


@router.post("/url/stream")
def import_url_stream(input_data: ImportURLInput):
    event_queue: Queue = Queue()

    def worker():
        db = SessionLocal()
        try:
            event_queue.put({"type": "detecting"})
            service = DouyinService(cookies_file=input_data.cookies_file)
            resolved_url = service.client.resolve_url(input_data.url)
            event_queue.put({"type": "ai_check"})

            result = recipe_service.import_from_url(
                db, url=input_data.url, cookies_file=input_data.cookies_file
            )
            event_queue.put({"type": "complete", "result": result})
        except HTTPException:
            raise
        except Exception as e:
            event_queue.put({"type": "error", "message": str(e)})
        finally:
            db.close()
            event_queue.put(None)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    def generate():
        while True:
            try:
                event = event_queue.get(timeout=30)
            except Exception:
                yield f"data: {json.dumps({'type': 'ping'}, ensure_ascii=False)}\n\n"
                continue
            if event is None:
                break
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
