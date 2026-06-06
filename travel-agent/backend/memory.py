"""
User profile persistence and system prompt construction.
Implements the memory/context pattern for the travel agent.
"""

import json
import os
from datetime import datetime
from pathlib import Path


DATA_DIR = Path(__file__).parent.parent / "data"
PROFILE_FILE = DATA_DIR / "user_profile.json"


class TravelMemory:
    def __init__(self):
        DATA_DIR.mkdir(exist_ok=True)
        self.profile = self._load_profile()

    def _load_profile(self) -> dict:
        if PROFILE_FILE.exists():
            with open(PROFILE_FILE) as f:
                return json.load(f)
        return {
            "name": "",
            "loyalty_programs": {},
            "preferred_airlines": [],
            "preferred_hotels": [],
            "cabin_preference": "economy",
            "seat_preference": "window",
            "budget_per_night": None,
            "dietary_restrictions": [],
            "pet_friendly_required": False,
            "past_trips": [],
        }

    def save_profile(self):
        with open(PROFILE_FILE, "w") as f:
            json.dump(self.profile, f, indent=2)

    def update(self, updates: dict):
        """Merge partial updates into the profile and persist."""
        for key, value in updates.items():
            if key in self.profile:
                # Merge lists instead of replacing them
                if isinstance(self.profile[key], list) and isinstance(value, list):
                    merged = list({v: None for v in self.profile[key] + value}.keys())
                    self.profile[key] = merged
                # Merge dicts (e.g. loyalty_programs)
                elif isinstance(self.profile[key], dict) and isinstance(value, dict):
                    self.profile[key].update(value)
                else:
                    self.profile[key] = value
        self.save_profile()

    def append_trip(self, itinerary: dict):
        """Record a completed/approved trip for future personalization."""
        itinerary["saved_at"] = datetime.now().isoformat()
        self.profile["past_trips"].append(itinerary)
        self.save_profile()

    def get_profile(self) -> dict:
        return self.profile

    def get_system_prompt(self) -> str:
        p = self.profile
        name = p["name"] or "the traveler"
        programs = p["loyalty_programs"]
        preferred_airlines = ", ".join(p["preferred_airlines"]) if p["preferred_airlines"] else "none specified"
        preferred_hotels = ", ".join(p["preferred_hotels"]) if p["preferred_hotels"] else "none specified"
        budget = f"${p['budget_per_night']}/night" if p["budget_per_night"] else "not specified"
        past_trips_summary = (
            f"{len(p['past_trips'])} past trip(s) on record" if p["past_trips"] else "no past trips yet"
        )

        loyalty_lines = "\n".join(
            f"  - {prog}: {bal:,} points/miles"
            for prog, bal in programs.items()
        ) if programs else "  - No loyalty programs on file yet"

        return f"""You are a personal travel specialist assistant for {name}. \
Your job is to find the best possible travel arrangements by intelligently combining \
cash prices with loyalty program redemptions.

## Known User Profile
- Preferred airlines: {preferred_airlines}
- Preferred hotel chains: {preferred_hotels}
- Cabin preference: {p['cabin_preference']}
- Seat preference: {p['seat_preference']}
- Hotel budget: {budget}
- Pet-friendly required: {p['pet_friendly_required']}
- Dietary restrictions: {", ".join(p['dietary_restrictions']) if p['dietary_restrictions'] else "none"}
- Past trips: {past_trips_summary}

## Loyalty Program Balances
{loyalty_lines}

## Your Workflow — ALWAYS follow these steps in order:
1. Call `get_user_profile` to confirm the latest preferences and balances.
2. Call `search_flights` for outbound AND return legs separately.
3. Call `search_hotels` for the destination.
4. Call `check_miles_redemption` for any promising flights or hotels to evaluate \
   whether using miles is worth it vs. paying cash (aim for ≥1.5 cents/point).
5. **ALWAYS** call `reflect_on_options` before presenting anything to the user. \
   Compare all options on price, miles value, convenience, and user preferences. \
   State clearly which option you recommend and why.
6. Call `build_itinerary` with the top recommendation.
7. Call `generate_booking_links` to produce direct booking URLs.

Be specific about trade-offs (e.g., "spending 60k miles saves $520 vs paying cash, \
which is 1.7 cents/point — above the 1.5 threshold, so miles redemption wins here"). \
Never present options without first reflecting. If the user provides new preferences, \
call `update_user_profile` to remember them for future sessions."""
