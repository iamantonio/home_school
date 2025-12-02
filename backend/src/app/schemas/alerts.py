from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    """An alert for the family."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    alert_type: str
    title: str
    message: str
    read: bool
    created_at: str
    student_name: str | None = None


class AlertsListResponse(BaseModel):
    """List of alerts."""
    alerts: list[AlertResponse]
    unread_count: int
