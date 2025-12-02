import pytest
from httpx import ASGITransport, AsyncClient

from src.app.main import app


@pytest.mark.asyncio
async def test_get_sessions_requires_auth():
    """Test that sessions endpoint requires authentication."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/tutor/sessions")
        assert response.status_code == 401  # No auth header
