import datetime
from typing import Optional
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#1890ff"


class CategoryOut(BaseModel):
    id: int
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


class QAPairOut(BaseModel):
    id: int
    recipe_id: int
    question: str
    answer: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class RecipeBase(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    categories: Optional[list[str]] = None
    recipe_text: Optional[str] = None


class RecipeOut(BaseModel):
    id: int
    title: str
    douyin_url: Optional[str] = None
    source: str
    video_path: Optional[str] = None
    thumbnail: Optional[str] = None
    video_duration: Optional[float] = None
    is_cooking: Optional[bool] = None
    confidence: Optional[float] = None
    ai_summary: Optional[str] = None
    recipe_text: Optional[str] = None
    notes: Optional[str] = None
    file_hash: Optional[str] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    categories: list[CategoryOut] = []
    qa_pairs: list[QAPairOut] = []

    class Config:
        from_attributes = True


class RecipeListItem(BaseModel):
    id: int
    title: str
    source: str
    video_path: Optional[str] = None
    thumbnail: Optional[str] = None
    is_cooking: Optional[bool] = None
    confidence: Optional[float] = None
    video_duration: Optional[float] = None
    created_at: Optional[datetime.datetime] = None
    categories: list[CategoryOut] = []

    class Config:
        from_attributes = True


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    recipe_text: Optional[str] = None
    categories: Optional[list[str]] = None


class ImportURLInput(BaseModel):
    url: str
    cookies_file: Optional[str] = None


class ImportManualInput(BaseModel):
    title: str
    url: Optional[str] = None
    recipe_text: Optional[str] = None
    notes: Optional[str] = None
    categories: Optional[list[str]] = None


class ImportBatchInput(BaseModel):
    source: str
    cookies_file: Optional[str] = None


class AskQuestionInput(BaseModel):
    question: str
    cookies_file: Optional[str] = None


class SearchInput(BaseModel):
    query: str
    category: Optional[str] = None
    page: int = 1
    page_size: int = 20


class SearchResult(BaseModel):
    results: list[RecipeListItem]
    total: int
    page: int
    page_size: int


class SettingsOut(BaseModel):
    cookies_file: Optional[str] = None
    data_dir: str
    categories: list[CategoryOut]


class SettingsUpdate(BaseModel):
    cookies_file: Optional[str] = None
