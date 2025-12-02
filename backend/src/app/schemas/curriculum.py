from pydantic import BaseModel, ConfigDict


class LearningObjectiveBase(BaseModel):
    """Base schema for learning objectives."""
    title: str
    description: str | None = None
    order: int = 0
    standard_codes: list[str] = []


class LearningObjectiveCreate(LearningObjectiveBase):
    """Schema for creating a learning objective."""
    pass


class LearningObjectiveResponse(LearningObjectiveBase):
    """Schema for learning objective response."""
    model_config = ConfigDict(from_attributes=True)
    id: str


class UnitBase(BaseModel):
    """Base schema for units."""
    title: str
    description: str | None = None
    order: int = 0
    estimated_hours: int | None = None


class UnitCreate(UnitBase):
    """Schema for creating a unit."""
    objectives: list[LearningObjectiveCreate] = []


class UnitResponse(UnitBase):
    """Schema for unit response."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    learning_objectives: list[LearningObjectiveResponse] = []


class CurriculumBase(BaseModel):
    """Base schema for curriculum."""
    subject: str
    title: str
    description: str | None = None
    grade_level: int
    standards: list[str] = []


class CurriculumCreate(CurriculumBase):
    """Schema for creating a curriculum."""
    student_id: str
    units: list[UnitCreate] = []


class CurriculumResponse(CurriculumBase):
    """Schema for curriculum response."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    student_id: str
    units: list[UnitResponse] = []


class CurriculumListResponse(BaseModel):
    """Schema for listing curricula."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    subject: str
    title: str
    grade_level: int
    unit_count: int = 0
    objective_count: int = 0


class GenerateCurriculumRequest(BaseModel):
    """Request to generate a curriculum with AI."""
    student_id: str
    subject: str
    grade_level: int
    goals: str | None = None
