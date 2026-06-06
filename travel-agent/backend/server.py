"""
FastAPI REST server for the travel agent.

Endpoints:
  POST /chat            — send a message, get agent response
  GET  /profile         — view current user profile
  PUT  /profile         — update user profile directly
  GET  /health          — liveness check

Session state (conversation history) is kept in-memory per session_id.
In production, replace with Redis or a DB-backed store.
"""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from agent import TravelAgent
from pathlib import Path


# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────

agent: TravelAgent | None = None
sessions: dict[str, list] = {}  # session_id → conversation history


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent
    agent = TravelAgent()
    yield


app = FastAPI(title="Travel Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend files at /app/*
frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


# ──────────────────────────────────────────────
# Request / Response models
# ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None  # None → create new session


class ChatResponse(BaseModel):
    session_id: str
    text: str
    tool_calls_log: list[dict]
    reflection: dict | None
    itinerary: dict | None
    booking_links: dict | None
    iterations: int


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    loyalty_programs: dict | None = None
    preferred_airlines: list[str] | None = None
    preferred_hotels: list[str] | None = None
    cabin_preference: str | None = None
    seat_preference: str | None = None
    budget_per_night: float | None = None
    dietary_restrictions: list[str] | None = None
    pet_friendly_required: bool | None = None


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": "claude-sonnet-4-6"}


@app.get("/")
def root():
    index = frontend_dir / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"message": "Travel Agent API — open /app for the UI or POST /chat to start."}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not agent:
        raise HTTPException(503, "Agent not initialised")

    # Create or retrieve session
    session_id = req.session_id or str(uuid.uuid4())
    history = sessions.get(session_id, [])

    result = agent.chat(req.message, history)

    # Persist conversation: append user + final assistant turn
    history = history + [
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": result.text},
    ]
    sessions[session_id] = history

    return ChatResponse(
        session_id=session_id,
        text=result.text,
        tool_calls_log=result.tool_calls_log,
        reflection=result.reflection,
        itinerary=result.itinerary,
        booking_links=result.booking_links,
        iterations=result.iterations,
    )


@app.get("/profile")
def get_profile():
    if not agent:
        raise HTTPException(503, "Agent not initialised")
    return agent.memory.get_profile()


@app.put("/profile")
def update_profile(req: ProfileUpdateRequest):
    if not agent:
        raise HTTPException(503, "Agent not initialised")
    updates = req.model_dump(exclude_none=True)
    agent.memory.update(updates)
    return {"status": "saved", "profile": agent.memory.get_profile()}
