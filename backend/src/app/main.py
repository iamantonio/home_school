from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.api.auth import router as auth_router
from src.app.api.dashboard import router as dashboard_router
from src.app.api.tutor import router as tutor_router

app = FastAPI(
    title="Homeschool Platform API",
    description="AI-powered homeschool platform for grades 6-12",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(tutor_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
