import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base


recipe_categories = Table(
    "recipe_categories",
    Base.metadata,
    Column("recipe_id", Integer, ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    douyin_url = Column(String(1024), nullable=True, unique=True)
    source = Column(String(50), nullable=False, default="douyin")
    video_path = Column(String(1024), nullable=True)
    thumbnail = Column(String(1024), nullable=True)
    video_duration = Column(Float, nullable=True)
    is_cooking = Column(Boolean, nullable=True)
    confidence = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    recipe_text = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    file_hash = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    categories = relationship("Category", secondary=recipe_categories, back_populates="recipes")
    qa_pairs = relationship("QAPair", back_populates="recipe", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    color = Column(String(7), nullable=True, default="#1890ff")

    recipes = relationship("Recipe", secondary=recipe_categories, back_populates="categories")


class QAPair(Base):
    __tablename__ = "qa_pairs"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    recipe = relationship("Recipe", back_populates="qa_pairs")


class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(1024), nullable=True)
    title = Column(String(255), nullable=True)
    source = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
