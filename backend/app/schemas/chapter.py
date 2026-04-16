from pydantic import BaseModel


class ChapterMeta(BaseModel):
    chapter_id: str
    title: str
    module: int
    locked: bool = False


class ChapterContent(BaseModel):
    chapter_id: str
    title: str
    content: str


class ChapterNav(BaseModel):
    chapter_id: str
    title: str


class ChapterSummary(BaseModel):
    chapter_id: str
    key_points: list[str]
