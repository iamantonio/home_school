from pydantic import BaseModel, ConfigDict


class ChatMessage(BaseModel):
    """A chat message from the user."""
    message: str
    subject: str


class ChatResponse(BaseModel):
    """Response from the tutor."""
    session_id: str
    response: str


class SessionResponse(BaseModel):
    """Session information."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject: str
    status: str
    message_count: int
    summary: str | None = None


class EndSessionResponse(BaseModel):
    """Response when ending a session."""
    summary: str
    message_count: int


class MessageResponse(BaseModel):
    """A message in a session."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    created_at: str


class SessionDetailResponse(BaseModel):
    """Detailed session with messages."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject: str
    status: str
    message_count: int
    summary: str | None = None
    created_at: str
    messages: list[MessageResponse]
