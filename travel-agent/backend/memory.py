"""
Multi-user profile persistence.

Each user has a unique profile_id (UUID). Profiles are stored in
data/profiles/<profile_id>.json and loaded on demand.

The system prompt is built from the active profile each turn.
"""

import json
import uuid
from datetime import datetime
from pathlib import Path


DATA_DIR    = Path(__file__).parent.parent / "data"
PROFILES_DIR = DATA_DIR / "profiles"


def _default_profile() -> dict:
    return {
        "name": "",
        "email": "",
        "created_at": datetime.now().isoformat(),

        # Loyalty programs: {program_name: balance}
        "loyalty_programs": {},

        # Travel preferences
        "preferred_airlines":  [],
        "preferred_hotels":    [],
        "cabin_preference":    "economy",
        "seat_preference":     "window",
        "budget_per_night":    None,
        "total_trip_budget":   None,

        # Personal details
        "dietary_restrictions":    [],
        "accessibility_needs":     [],
        "pet_friendly_required":   False,

        # Trip type preferences (beach, adventure, city, wellness, ski, cruise, etc.)
        "trip_types_liked":    [],
        "trip_types_disliked": [],

        # Personal objectives / anything the agent should know
        "objectives": "",

        # Default traveler details (can be overridden per trip)
        "travelers": [{"name": "", "age": None, "passport_country": "US"}],

        # History
        "past_trips":    [],
        "active_watches": [],   # deal monitoring watches
    }


class TravelMemory:
    def __init__(self, profile_id: str | None = None):
        DATA_DIR.mkdir(exist_ok=True)
        PROFILES_DIR.mkdir(exist_ok=True)

        self.profile_id = profile_id or self._get_or_create_default_id()
        self.profile = self._load()

    # ── Profile I/O ──────────────────────────────────────────────────────────

    def _get_or_create_default_id(self) -> str:
        """Use a stable default profile for single-user / local mode."""
        default_file = DATA_DIR / "default_profile_id.txt"
        if default_file.exists():
            return default_file.read_text().strip()
        new_id = str(uuid.uuid4())
        default_file.write_text(new_id)
        return new_id

    def _path(self) -> Path:
        return PROFILES_DIR / f"{self.profile_id}.json"

    def _load(self) -> dict:
        p = self._path()
        if p.exists():
            with open(p) as f:
                saved = json.load(f)
            # Forward-fill any missing keys added in later versions
            default = _default_profile()
            for k, v in default.items():
                saved.setdefault(k, v)
            return saved
        base = _default_profile()
        self.save(base)
        return base

    def save(self, data: dict | None = None):
        if data:
            self.profile = data
        with open(self._path(), "w") as f:
            json.dump(self.profile, f, indent=2)

    def update(self, updates: dict):
        """Merge partial updates (lists merge, dicts merge)."""
        for key, value in updates.items():
            if key not in self.profile:
                self.profile[key] = value
            elif isinstance(self.profile[key], list) and isinstance(value, list):
                merged = list({str(v): v for v in self.profile[key] + value}.values())
                self.profile[key] = merged
            elif isinstance(self.profile[key], dict) and isinstance(value, dict):
                self.profile[key].update(value)
            else:
                self.profile[key] = value
        self.save()

    def append_trip(self, itinerary: dict):
        itinerary["saved_at"] = datetime.now().isoformat()
        self.profile["past_trips"].append(itinerary)
        self.save()

    def get_profile(self) -> dict:
        return self.profile

    # ── Multi-user helpers ───────────────────────────────────────────────────

    @staticmethod
    def create_profile() -> "TravelMemory":
        new_id = str(uuid.uuid4())
        m = TravelMemory.__new__(TravelMemory)
        m.profile_id = new_id
        DATA_DIR.mkdir(exist_ok=True)
        PROFILES_DIR.mkdir(exist_ok=True)
        base = _default_profile()
        m.profile = base
        m.save(base)
        return m

    @staticmethod
    def load_profile(profile_id: str) -> "TravelMemory | None":
        path = PROFILES_DIR / f"{profile_id}.json"
        if not path.exists():
            return None
        m = TravelMemory.__new__(TravelMemory)
        m.profile_id = profile_id
        DATA_DIR.mkdir(exist_ok=True)
        PROFILES_DIR.mkdir(exist_ok=True)
        m.profile = m._load()
        return m

    @staticmethod
    def list_profiles() -> list[dict]:
        PROFILES_DIR.mkdir(exist_ok=True)
        results = []
        for p in sorted(PROFILES_DIR.glob("*.json")):
            try:
                with open(p) as f:
                    data = json.load(f)
                results.append({"profile_id": p.stem, "name": data.get("name", ""), "email": data.get("email", "")})
            except Exception:
                pass
        return results

    # ── Watches (deal monitoring) ────────────────────────────────────────────

    def add_watch(self, watch: dict) -> str:
        watch_id = str(uuid.uuid4())[:8]
        watch["id"] = watch_id
        watch["created_at"] = datetime.now().isoformat()
        watch["status"] = "active"
        watch["last_checked"] = None
        watch["alert_sent"] = False
        self.profile["active_watches"].append(watch)
        self.save()
        return watch_id

    def mark_watch_alerted(self, watch_id: str):
        for w in self.profile["active_watches"]:
            if w["id"] == watch_id:
                w["alert_sent"] = True
                w["alerted_at"] = datetime.now().isoformat()
        self.save()

    def update_watch_checked(self, watch_id: str):
        for w in self.profile["active_watches"]:
            if w["id"] == watch_id:
                w["last_checked"] = datetime.now().isoformat()
        self.save()

    # ── System Prompt ────────────────────────────────────────────────────────

    def get_system_prompt(self) -> str:
        p = self.profile
        name = p["name"] or "the traveler"
        programs = p["loyalty_programs"]
        objectives = p.get("objectives", "")
        trip_types = ", ".join(p.get("trip_types_liked", [])) or "not specified"
        restrictions = ", ".join(p.get("dietary_restrictions", []) + p.get("accessibility_needs", [])) or "none"
        budget = f"${p['total_trip_budget']:,} total" if p.get("total_trip_budget") else (
            f"${p['budget_per_night']}/night" if p.get("budget_per_night") else "flexible"
        )

        travelers = p.get("travelers", [])
        traveler_count = len(travelers)
        traveler_desc = f"{traveler_count} traveler(s)"

        loyalty_lines = "\n".join(
            f"  - {prog}: {int(bal):,} points/miles"
            for prog, bal in programs.items()
        ) if programs else "  - No programs added yet — ask the user!"

        past_summary = f"{len(p.get('past_trips', []))} past trip(s) on record" if p.get("past_trips") else "No past trips yet"

        return f"""You are a personal AI travel specialist for {name}. \
Your job is to find the absolute best travel arrangements by combining \
cash prices with loyalty program redemptions across all major programs.

## User Profile
- Preferred airlines: {", ".join(p.get("preferred_airlines", [])) or "open to anything"}
- Preferred hotels: {", ".join(p.get("preferred_hotels", [])) or "open to anything"}
- Cabin preference: {p.get("cabin_preference", "economy")}
- Seat preference: {p.get("seat_preference", "window")}
- Hotel budget: {budget}
- Trip styles liked: {trip_types}
- Dietary/accessibility: {restrictions}
- Pet-friendly required: {p.get("pet_friendly_required", False)}
- Travelers: {traveler_desc}
- Past trips: {past_summary}
{f"- Personal objectives: {objectives}" if objectives else ""}

## Loyalty Program Balances
{loyalty_lines}

## Your Workflow — follow these steps for every travel request:
1. Call `get_user_profile` first to confirm latest data.
2. If the user hasn't specified destination, dates, budget, or number of travelers — ask for those now \
   using natural conversation, then call `update_trip_context` to save them.
3. Call `search_flights` for outbound AND return legs.
4. Call `search_hotels` for the destination.
5. Call `evaluate_all_redemptions` to analyze every loyalty program for best redemption value — \
   compare all currencies the user has.
6. Call `check_destination_insights` for destination-specific advice (weather, seaweed, events, entry requirements).
7. **ALWAYS** call `reflect_on_options` before presenting anything. Compare all options on: \
   price, redemption value (state cents-per-point math), user preferences, and trip objectives.
8. Call `build_itinerary` with your top recommendation.
9. Call `generate_booking_links` to produce booking URLs.
10. Ask: "Would you like me to set up a deal alert to watch for price drops on this route?"
    If yes, call `add_deal_alert`.

## Rules
- Never present options without first calling `reflect_on_options`.
- Always state exact CPP math (e.g. "60k miles = $840 value at 1.4¢/pt — below 1.5¢ threshold, pay cash instead").
- When a user mentions a loyalty program or balance, immediately call `update_user_profile` to save it.
- When the user asks you to "watch for deals" or "alert me", call `add_deal_alert` with a specific trigger.
- Be a genuine expert: mention partner transfer options, sweet spots, and avoid bad redemptions."""
