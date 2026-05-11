from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Recipe, QAPair
from ..services.douyin_service import DouyinService
from ..schemas import AskQuestionInput, QAPairOut

router = APIRouter(prefix="/api/ai", tags=["ai"])


class QAResponse(BaseModel):
    answer: Optional[str] = None
    error: Optional[str] = None


@router.post("/ask/{recipe_id}")
def ask_question(
    recipe_id: int,
    input_data: AskQuestionInput,
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    if not recipe.douyin_url:
        raise HTTPException(status_code=400, detail="该菜谱无关联抖音视频")

    service = DouyinService(cookies_file=input_data.cookies_file)
    answer = service.ask_question(recipe.douyin_url, input_data.question, input_data.cookies_file)

    qa = QAPair(
        recipe_id=recipe_id,
        question=input_data.question,
        answer=answer,
    )
    db.add(qa)
    db.commit()
    db.refresh(qa)

    if answer is None:
        return QAResponse(error="登录已过期，请重新登录")

    return QAResponse(answer=answer)


@router.get("/qa/{recipe_id}", response_model=list[QAPairOut])
def get_qa_history(recipe_id: int, db: Session = Depends(get_db)):
    return db.query(QAPair).filter(QAPair.recipe_id == recipe_id).order_by(QAPair.created_at.desc()).all()
