"""
FastAPI server for the AI Travel Agent.

Multi-user: each client carries a profile_id in requests.
New visitors get a fresh profile via POST /profiles.
Profiles are stored in data/profiles/<uuid>.json.

Endpoints:
  POST /profiles                     — create new profile, returns profile_id
  GET  /profiles/{profile_id}        — get profile
  PUT  /profiles/{profile_id}        — update profile
  GET  /profiles/{profile_id}/watches — list deal watches
  POST /chat                         — run agent turn
  GET  /health                       — liveness
  POST /monitor/check-now            — force deal check (demo/testing)
  GET  /loyalty-programs             — list all 23 programs
"""

import logging
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import tools as tool_module
from loyalty import ALL_PROGRAM_NAMES, PROGRAMS
from memory import TravelMemory
from monitor import start_monitor, stop_monitor, trigger_check_now

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Per-profile session stores ───────────────────────────────────────────────
# sessions[profile_id] → list of message dicts
sessions: dict[str, list] = {}
_agents: dict[str, object] = {}   # lazy-loaded TravelAgent per profile


def get_agent(profile_id: str):
    """Lazy-load a TravelAgent for the given profile."""
    if profile_id not in _agents:
        from agent import TravelAgent
        _agents[profile_id] = TravelAgent(profile_id=profile_id)
    return _agents[profile_id]


# ── App lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_monitor()
    yield
    stop_monitor()


app = FastAPI(title="AI Travel Agent", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


# ── Request / Response models ─────────────────────────────────────────────────

class NewProfileRequest(BaseModel):
    name: str = ""
    email: str = ""

class ProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    loyalty_programs: dict | None = None
    preferred_airlines: list[str] | None = None
    preferred_hotels: list[str] | None = None
    cabin_preference: str | None = None
    seat_preference: str | None = None
    budget_per_night: float | None = None
    total_trip_budget: float | None = None
    dietary_restrictions: list[str] | None = None
    accessibility_needs: list[str] | None = None
    pet_friendly_required: bool | None = None
    trip_types_liked: list[str] | None = None
    trip_types_disliked: list[str] | None = None
    objectives: str | None = None

class ChatRequest(BaseModel):
    message: str
    profile_id: str | None = None   # None → use default single-user profile

class ChatResponse(BaseModel):
    profile_id: str
    text: str
    tool_calls_log: list[dict]
    reflection: dict | None
    itinerary: dict | None
    booking_links: dict | None
    iterations: int


# ── Profile endpoints ─────────────────────────────────────────────────────────

@app.post("/profiles", status_code=201)
def create_profile(req: NewProfileRequest = NewProfileRequest()):
    mem = TravelMemory.create_profile()
    if req.name or req.email:
        mem.update({"name": req.name, "email": req.email})
    return {"profile_id": mem.profile_id, "profile": mem.get_profile()}


@app.get("/profiles/{profile_id}")
def get_profile(profile_id: str):
    mem = TravelMemory.load_profile(profile_id)
    if not mem:
        raise HTTPException(404, f"Profile {profile_id} not found")
    return mem.get_profile()


@app.put("/profiles/{profile_id}")
def update_profile(profile_id: str, req: ProfileUpdate):
    mem = TravelMemory.load_profile(profile_id)
    if not mem:
        raise HTTPException(404, f"Profile {profile_id} not found")
    mem.update(req.model_dump(exclude_none=True))
    # Invalidate cached agent so it picks up new memory
    _agents.pop(profile_id, None)
    return {"status": "saved", "profile": mem.get_profile()}


@app.get("/profiles/{profile_id}/watches")
def get_watches(profile_id: str):
    mem = TravelMemory.load_profile(profile_id)
    if not mem:
        raise HTTPException(404, f"Profile {profile_id} not found")
    return {"watches": mem.profile.get("active_watches", [])}


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    profile_id = req.profile_id or _get_default_profile_id()
    mem = TravelMemory.load_profile(profile_id)
    if not mem:
        # Auto-create profile on first use
        mem = TravelMemory.create_profile()
        profile_id = mem.profile_id

    agent = get_agent(profile_id)
    history = sessions.get(profile_id, [])

    result = agent.chat(req.message, history)

    sessions[profile_id] = history + [
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": result.text},
    ]

    return ChatResponse(
        profile_id=profile_id,
        text=result.text,
        tool_calls_log=result.tool_calls_log,
        reflection=result.reflection,
        itinerary=result.itinerary,
        booking_links=result.booking_links,
        iterations=result.iterations,
    )


# ── Utility endpoints ─────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": "claude-sonnet-4-6", "monitor": "running"}


@app.get("/loyalty-programs")
def list_loyalty_programs():
    return {
        "programs": [
            {"name": k, "type": v["type"], "currency": v["currency"], "typical_cpp": v["typical_cpp"]}
            for k, v in PROGRAMS.items()
        ]
    }


@app.post("/monitor/check-now")
def force_check():
    result = trigger_check_now()
    return result


@app.get("/")
def root():
    index = frontend_dir / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"message": "AI Travel Agent API v2 — POST /profiles to start, or open /app for the UI."}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_default_profile_id() -> str:
    from memory import DATA_DIR
    default_file = DATA_DIR / "default_profile_id.txt"
    if default_file.exists():
        return default_file.read_text().strip()
    mem = TravelMemory.create_profile()
    default_file.write_text(mem.profile_id)
    return mem.profile_id
