"""
app.py — TruthLens Backend Entry Point
FastAPI application with CORS, routing, and static file support.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from routes.analyze import router as analyze_router
from routes.upload import router as upload_router

# ── Application Factory ─────────────────────────────────────────
app = FastAPI(
    title="TruthLens API",
    description="AI-powered fake news detection backend",
    version="1.0.0",
)

# ── Middleware (order matters: outermost first) ──────────────────
# CORS — must be outermost so preflight is handled before GZip
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip — compresses responses > 500 bytes (60-80% size reduction)
app.add_middleware(GZipMiddleware, minimum_size=500)

# ── Routers ─────────────────────────────────────────────────────
app.include_router(analyze_router)
app.include_router(upload_router)


# ── Health Check ────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "TruthLens API", "version": "1.0.0"}


# ── Global Exception Handler ─────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


# ── Dev Server ───────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 10000))

    uvicorn.run("app:app", host="0.0.0.0", port=port)

