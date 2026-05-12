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
    tags: Optional[str] = None
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
    tags: Optional[str] = None
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
    tags: Optional[str] = None
    categories: list[CategoryOut] = []

    class Config:
        from_attributes = True


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    recipe_text: Optional[str] = None
    tags: Optional[str] = None
    categories: Optional[list[str]] = None


from pydantic import Field

class ImportURLInput(BaseModel):
    url: str = Field(min_length=1)
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
    cookies_valid: Optional[bool] = None
    avatar_url: Optional[str] = None
    nickname: Optional[str] = None


class SettingsUpdate(BaseModel):
    cookies_file: Optional[str] = None


class LoginStartResponse(BaseModel):
    login_id: str
    status: str


class LoginStatusResponse(BaseModel):
    status: str
    qr_code: Optional[str] = None
    message: str = ""
    cookies_file: Optional[str] = None
    avatar_url: Optional[str] = None
    nickname: Optional[str] = None


class LoginCheckResponse(BaseModel):
    logged_in: bool
    cookies_file: str
    avatar_url: Optional[str] = None
    nickname: Optional[str] = None
