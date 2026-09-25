from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import auth, hosted_zones, records

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Route53 Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo project - relax CORS for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
