"""
AquaPredict FastAPI Application
Entrypoint for the AquaPredict water quality assessment backend API.
"""

from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import (
    APP_DESCRIPTION,
    APP_NAME,
    APP_VERSION,
    CORS_ORIGINS,
)
from backend.app.model_service import model_service
from backend.app.routes.health import router as health_router
from backend.app.routes.prediction import router as prediction_router

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("aquapredict.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events.
    Loads the machine learning pipeline into memory at startup.
    """
    logger.info("Initializing AquaPredict backend service...")
    loaded = model_service.load_model()
    if loaded:
        logger.info(f"Model successfully initialized: {model_service.model_name}")
    else:
        logger.warning(
            f"Model failed to load at startup: {model_service.load_error}. "
            "Readiness check will report NOT READY until model is available."
        )
    yield
    logger.info("Shutting down AquaPredict backend service...")


def create_app() -> FastAPI:
    """Application factory constructing the configured FastAPI instance."""
    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        description=APP_DESCRIPTION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # Custom Exception Handlers for Security and Clean Error Messages
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        formatted_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            formatted_errors.append({
                "field": loc,
                "message": err.get("msg", "Invalid input value"),
                "type": err.get("type", "validation_error"),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={
                "error": "Request validation failed",
                "details": formatted_errors,
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Log internal detail to console without exposing stack trace to API client
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred while processing the request.",
            },
        )

    # Register Routers
    app.include_router(health_router)
    app.include_router(prediction_router)

    return app


# Root ASGI application instance
app = create_app()
