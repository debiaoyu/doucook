import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/video", tags=["video"])


@router.get("/{path:path}")
def serve_video(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="视频文件不存在")
    return FileResponse(path, media_type="video/mp4")
