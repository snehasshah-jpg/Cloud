"""
Tool definitions and handlers for the travel agent.

Two parts per tool:
  1. Claude API schema (in TOOL_SCHEMAS)
  2. Python handler function

Covers: profile management, flight/hotel search (any destination),
full loyalty program evaluation, destination insights, deal monitoring,
multi-traveler support, itinerary building, and booking links.
"""

import hashlib
import json
import random
from datetime import datetime, timedelta

from loyalty import PROGRAMS, evaluate_redemption_options, ALL_PROGRAM_NAMES
from mock_data import (
    FLIGHTS, HOTELS,
    get_flights_by_route, get_flight_by_id, get_hotel_by_id,
)

# ──────────────────────────────────────────────────────────────────────────────
# Claude tool schemas
# ──────────────────────────────────────────────────────────────────────────────

TOOL_SCHEMAS = [
    # ── Profile ──────────────────────────────────────────────────────────────
    {
        "name": "get_user_profile",
        "description": "Retrieve the user's stored profile: preferences, loyalty program balances, travelers, objectives, past trips, and active deal watches. Call this first every session.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "update_user_profile",
        "description": (
            "Persist any new or updated user information. Call whenever the user mentions "
            "their name, email, loyalty balances, preferred airlines/hotels, cabin class, "
            "budget, dietary needs, accessibility needs, pet requirements, objectives, or "
            "trip style preferences."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name":                  {"type": "string"},
                "email":                 {"type": "string", "description": "For deal alert emails"},
                "loyalty_programs":      {"type": "object", "additionalProperties": {"type": "number"},
                                          "description": "Dict of program name → balance, e.g. {\"United MileagePlus\": 125000}"},
                "preferred_airlines":    {"type": "array", "items": {"type": "string"}},
                "preferred_hotels":      {"type": "array", "items": {"type": "string"}},
                "cabin_preference":      {"type": "string", "enum": ["economy","premium_economy","business","first"]},
                "seat_preference":       {"type": "string", "enum": ["window","aisle","middle","bulkhead"]},
                "budget_per_night":      {"type": "number"},
                "total_trip_budget":     {"type": "number", "description": "Total budget for the whole trip (flights + hotel)"},
                "dietary_restrictions":  {"type": "array", "items": {"type": "string"}},
                "accessibility_needs":   {"type": "array", "items": {"type": "string"}},
                "pet_friendly_required": {"type": "boolean"},
                "trip_types_liked":      {"type": "array", "items": {"type": "string"},
                                          "description": "e.g. beach, adventure, city, wellness, ski, cruise, safari, cultural"},
                "trip_types_disliked":   {"type": "array", "items": {"type": "string"}},
                "objectives":            {"type": "string", "description": "Free-text: personal goals, must-haves, dealbreakers"},
            },
            "required": [],
        },
    },
    {
        "name": "add_traveler",
        "description": "Add or update a traveler on the trip. Call once per person beyond the profile owner.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name":             {"type": "string"},
                "age":              {"type": "integer"},
                "passport_country": {"type": "string", "description": "2-letter ISO country code"},
                "dietary_needs":    {"type": "string"},
                "seat_preference":  {"type": "string", "enum": ["window","aisle","middle","none"]},
                "loyalty_program":  {"type": "string", "description": "This traveler's primary loyalty program"},
                "loyalty_number":   {"type": "string"},
            },
            "required": ["name"],
        },
    },
    {
        "name": "update_trip_context",
        "description": (
            "Save the specific details for this trip: destination, dates, number of travelers, "
            "trip type, and budget. Call this once you've gathered the basics from the user."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "origin":           {"type": "string", "description": "City name or 3-letter IATA code"},
                "destination":      {"type": "string", "description": "City name or IATA code"},
                "departure_date":   {"type": "string", "description": "YYYY-MM-DD"},
                "return_date":      {"type": "string", "description": "YYYY-MM-DD (optional for one-way)"},
                "num_travelers":    {"type": "integer", "default": 1},
                "trip_type":        {"type": "string",
                                     "description": "beach, adventure, city, wellness, ski, cruise, business, honeymoon, family, etc."},
                "budget_total":     {"type": "number", "description": "Total trip budget in USD"},
                "flexibility_days": {"type": "integer", "description": "How many days ±flexible on dates"},
                "special_occasion": {"type": "string", "description": "Anniversary, birthday, honeymoon, etc."},
            },
            "required": ["origin", "destination", "departure_date"],
        },
    },

    # ── Flights & Hotels ─────────────────────────────────────────────────────
    {
        "name": "search_flights",
        "description": (
            "Search available flights between two airports/cities on a given date. "
            "Works for any origin-destination pair. Returns all matching flights with "
            "prices in cash and miles for each cabin class."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "origin":             {"type": "string", "description": "IATA code or city name, e.g. EWR or Newark"},
                "destination":        {"type": "string", "description": "IATA code or city name, e.g. CUN or Cancun"},
                "departure_date":     {"type": "string", "description": "YYYY-MM-DD"},
                "cabin_class":        {"type": "string", "enum": ["economy","premium_economy","business","first"]},
                "num_passengers":     {"type": "integer", "default": 1},
                "preferred_airlines": {"type": "array", "items": {"type": "string"}},
                "nonstop_only":       {"type": "boolean", "default": False},
                "max_price_pp":       {"type": "number", "description": "Max price per person in USD"},
            },
            "required": ["origin", "destination", "departure_date"],
        },
    },
    {
        "name": "search_hotels",
        "description": (
            "Search available hotels in any city for the given dates. "
            "Returns hotels with nightly price, loyalty points cost, amenities, and policies."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "city":                {"type": "string"},
                "check_in":            {"type": "string", "description": "YYYY-MM-DD"},
                "check_out":           {"type": "string", "description": "YYYY-MM-DD"},
                "min_stars":           {"type": "integer", "enum": [1,2,3,4,5]},
                "max_price_per_night": {"type": "number"},
                "pet_friendly":        {"type": "boolean"},
                "trip_type":           {"type": "string", "description": "Helps filter by property type: beach, ski, city, wellness, etc."},
                "preferred_programs":  {"type": "array", "items": {"type": "string"}},
            },
            "required": ["city", "check_in", "check_out"],
        },
    },

    # ── Loyalty & Redemptions ────────────────────────────────────────────────
    {
        "name": "evaluate_all_redemptions",
        "description": (
            "Analyze ALL of the user's loyalty programs against a cash price and rank them "
            "by redemption value. Shows cents-per-point math, which programs can cover the "
            "cost, and transfer partner options. Call before reflect_on_options."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "cash_price":   {"type": "number", "description": "The cash price in USD to compare against"},
                "item_type":    {"type": "string", "enum": ["flight","hotel","both"]},
                "description":  {"type": "string", "description": "What this is for, e.g. 'UA467 business EWR-CUN'"},
            },
            "required": ["cash_price", "item_type"],
        },
    },
    {
        "name": "check_miles_redemption",
        "description": "Calculate cents-per-point for a specific flight or hotel redemption.",
        "input_schema": {
            "type": "object",
            "properties": {
                "item_id":         {"type": "string"},
                "item_type":       {"type": "string", "enum": ["flight","hotel"]},
                "cabin_class":     {"type": "string"},
                "loyalty_program": {"type": "string"},
                "user_balance":    {"type": "number"},
            },
            "required": ["item_id","item_type","loyalty_program","user_balance"],
        },
    },
    {
        "name": "get_loyalty_program_info",
        "description": "Get details on any loyalty program: transfer partners, sweet spots, and typical value. Use this to explain options to the user.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_name": {"type": "string", "description": "Full program name, e.g. 'Chase Ultimate Rewards'"},
            },
            "required": ["program_name"],
        },
    },

    # ── Destination Intelligence ─────────────────────────────────────────────
    {
        "name": "check_destination_insights",
        "description": (
            "Get destination-specific intelligence: weather, seasonal events, sargassum/pollution "
            "risk, visa requirements, safety, best neighborhoods, and travel warnings. "
            "Call for every new destination."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "destination":    {"type": "string"},
                "travel_month":   {"type": "string", "description": "e.g. 'november' or '11'"},
                "trip_type":      {"type": "string"},
                "origin_country": {"type": "string", "default": "US", "description": "Passport country for visa check"},
            },
            "required": ["destination", "travel_month"],
        },
    },
    {
        "name": "suggest_optimal_dates",
        "description": (
            "Given a destination and trip objectives, suggest the 2-3 best travel windows "
            "that balance low prices, ideal weather, avoiding crowds, and user preferences."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "destination":  {"type": "string"},
                "trip_type":    {"type": "string"},
                "avoid_crowds": {"type": "boolean"},
                "budget_focus": {"type": "boolean", "description": "Prioritize lowest cost"},
                "num_nights":   {"type": "integer"},
            },
            "required": ["destination"],
        },
    },

    # ── Reflection & Planning ────────────────────────────────────────────────
    {
        "name": "reflect_on_options",
        "description": (
            "REQUIRED before any recommendation. Compare all flight and hotel options "
            "against the user's profile, budget, loyalty programs, and trip objectives. "
            "State your reasoning clearly, including CPP math."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "flight_comparison":     {"type": "string"},
                "hotel_comparison":      {"type": "string"},
                "redemption_strategy":   {"type": "string", "description": "Which programs to use and why, with CPP math"},
                "alignment_with_goals":  {"type": "string", "description": "How well does the recommendation match trip type, objectives, restrictions?"},
                "recommendation":        {"type": "string", "description": "Final pick with total cost breakdown (cash + miles + points)"},
                "warnings":              {"type": "string", "description": "Any red flags: sargassum, hurricane season, visa issues, limited availability"},
            },
            "required": ["flight_comparison","hotel_comparison","redemption_strategy","recommendation"],
        },
    },
    {
        "name": "build_itinerary",
        "description": "Assemble the final itinerary from selected options.",
        "input_schema": {
            "type": "object",
            "properties": {
                "outbound_flight_id":    {"type": "string"},
                "return_flight_id":      {"type": "string"},
                "hotel_id":              {"type": "string"},
                "cabin_class":           {"type": "string", "enum": ["economy","premium_economy","business","first"]},
                "num_travelers":         {"type": "integer", "default": 1},
                "use_miles_flight":      {"type": "boolean"},
                "use_points_hotel":      {"type": "boolean"},
                "miles_program":         {"type": "string", "description": "Which program to use for flight miles"},
                "points_program":        {"type": "string", "description": "Which program to use for hotel points"},
                "notes":                 {"type": "string"},
            },
            "required": ["outbound_flight_id","hotel_id","cabin_class"],
        },
    },
    {
        "name": "generate_booking_links",
        "description": "Generate booking URLs for the approved itinerary.",
        "input_schema": {
            "type": "object",
            "properties": {
                "itinerary_id": {"type": "string"},
            },
            "required": ["itinerary_id"],
        },
    },

    # ── Deal Monitoring ──────────────────────────────────────────────────────
    {
        "name": "add_deal_alert",
        "description": (
            "Set up a background deal watch. The agent will monitor this route/hotel "
            "and email the user when a trigger is hit (price drop, award availability, "
            "limited seats). Ask the user if they want this after building an itinerary."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "description":        {"type": "string", "description": "Human-readable trip description, e.g. 'EWR→CUN Nov 14, 7 nights at Palmaïa'"},
                "origin":             {"type": "string"},
                "destination":        {"type": "string"},
                "travel_month":       {"type": "string", "description": "e.g. 'november 2026'"},
                "max_price_target":   {"type": "number", "description": "Alert if round-trip drops below this price"},
                "hotel_id":           {"type": "string", "description": "Watch this specific hotel for price drops"},
                "max_hotel_rate":     {"type": "number", "description": "Alert if nightly rate drops below this"},
                "award_alert":        {"type": "boolean", "description": "Alert when award space opens in preferred cabin"},
                "preferred_cabin":    {"type": "string"},
                "alert_email":        {"type": "string", "description": "Override email for this alert (uses profile email if omitted)"},
            },
            "required": ["description", "origin", "destination"],
        },
    },
]


# ──────────────────────────────────────────────────────────────────────────────
# Shared state
# ──────────────────────────────────────────────────────────────────────────────

_memory = None
_itinerary_store: dict[str, dict] = {}


def set_memory(mem):
    global _memory
    _memory = mem


# ──────────────────────────────────────────────────────────────────────────────
# Dynamic mock data — generates plausible results for any route/city
# ──────────────────────────────────────────────────────────────────────────────

_AIRLINE_ROUTES = {
    # Major US carriers with typical coverage
    "United": ["SFO","EWR","ORD","IAH","DEN","LAX"],
    "Delta":  ["JFK","ATL","LAX","SEA","DTW","SLC"],
    "American":["JFK","MIA","CLT","DFW","LAX","PHL"],
    "JetBlue":["JFK","BOS","FLL","EWR","LAX"],
    "Southwest":["MDW","HOU","DAL","PHX","LAS","BWI"],
    "Air France":["CDG"],
    "British Airways":["LHR"],
    "Lufthansa":["FRA","MUC"],
}

_CITY_TO_IATA = {
    "new york": "JFK", "newark": "EWR", "los angeles": "LAX", "chicago": "ORD",
    "miami": "MIA", "san francisco": "SFO", "boston": "BOS", "seattle": "SEA",
    "cancun": "CUN", "paris": "CDG", "london": "LHR", "rome": "FCO",
    "tokyo": "NRT", "dubai": "DXB", "mexico city": "MEX", "barcelona": "BCN",
    "amsterdam": "AMS", "frankfurt": "FRA", "singapore": "SIN", "sydney": "SYD",
    "madrid": "MAD", "zurich": "ZRH", "toronto": "YYZ", "montreal": "YUL",
    "playa del carmen": "CUN", "tulum": "CUN", "riviera maya": "CUN",
    "punta cana": "PUJ", "montego bay": "MBJ", "nassau": "NAS",
    "honolulu": "HNL", "maui": "OGG", "las vegas": "LAS", "orlando": "MCO",
    "denver": "DEN", "phoenix": "PHX", "dallas": "DFW", "atlanta": "ATL",
    "puerto rico": "SJU", "san juan": "SJU", "aruba": "AUA", "curacao": "CUR",
    "turks and caicos": "PLS", "st maarten": "SXM", "barbados": "BGI",
    "costa rica": "SJO", "san jose": "SJO", "lisbon": "LIS", "athens": "ATH",
    "istanbul": "IST", "bangkok": "BKK", "bali": "DPS", "cape town": "CPT",
    "rio de janeiro": "GIG", "buenos aires": "EZE", "lima": "LIM",
}


def _resolve_iata(location: str) -> str:
    loc = location.strip().upper()
    if len(loc) == 3 and loc.isalpha():
        return loc
    return _CITY_TO_IATA.get(location.lower(), location.upper()[:3])


def _seed_rand(s: str) -> random.Random:
    """Deterministic random for the same route — stable mock data."""
    seed = int(hashlib.md5(s.encode()).hexdigest()[:8], 16)
    return random.Random(seed)


def _generate_flights(origin: str, destination: str, cabin_class: str | None = None,
                      preferred_airlines: list | None = None, nonstop_only: bool = False,
                      max_price_pp: float | None = None) -> list[dict]:
    """Generate plausible mock flights for any route."""
    # Check real data first
    real = get_flights_by_route(origin, destination)
    if real:
        if preferred_airlines:
            real = sorted(real, key=lambda f: (f["airline"] not in preferred_airlines,
                                               min(v["price_usd"] for v in f["cabin_classes"].values())))
        out = []
        for f in real:
            row = {k: v for k, v in f.items() if k != "cabin_classes"}
            row["cabin_info"] = {cabin_class: f["cabin_classes"][cabin_class]} if cabin_class and cabin_class in f["cabin_classes"] else f["cabin_classes"]
            out.append(row)
        return out

    # Generate synthetic results
    rng = _seed_rand(f"{origin}{destination}")

    # Rough distance model → price tiers
    distance_class = "short"
    if any(x in destination for x in ["CDG","LHR","FRA","AMS","MAD","LIS","BCN","FCO","ATH","IST"]):
        distance_class = "transatlantic"
    elif any(x in destination for x in ["NRT","SIN","BKK","DPS","SYD","DXB","CPT"]):
        distance_class = "longhaul"
    elif any(x in destination for x in ["CUN","PUJ","MBJ","SJU","AUA","SJO","LIM","GIG","EZE"]):
        distance_class = "caribbean_latam"

    price_base = {"short": 180, "caribbean_latam": 280, "transatlantic": 650, "longhaul": 900}[distance_class]
    duration   = {"short": 150, "caribbean_latam": 320, "transatlantic": 640, "longhaul": 900}[distance_class]

    airlines = [
        {"airline": "United",    "program": "United MileagePlus",   "id_prefix": "UA"},
        {"airline": "JetBlue",   "program": "JetBlue TrueBlue",     "id_prefix": "B6"},
        {"airline": "American",  "program": "American AAdvantage",  "id_prefix": "AA"},
        {"airline": "Delta",     "program": "Delta SkyMiles",       "id_prefix": "DL"},
    ]
    if preferred_airlines:
        airlines = sorted(airlines, key=lambda a: a["airline"] not in preferred_airlines)

    results = []
    for i, al in enumerate(airlines[:3]):
        f_price  = int(price_base * rng.uniform(0.85, 1.3))
        stops    = 0 if i < 2 and distance_class != "longhaul" else rng.choice([0, 1])
        dur      = duration + (stops * 90) + rng.randint(-20, 40)

        if nonstop_only and stops > 0:
            continue
        if max_price_pp and f_price > max_price_pp:
            continue

        econ_miles   = int(f_price / 0.0135)
        biz_price    = int(f_price * rng.uniform(2.8, 4.5))
        biz_miles    = int(biz_price / 0.0145)
        pe_price     = int(f_price * rng.uniform(1.6, 2.2))

        dep_hour = rng.choice([6, 7, 8, 9, 10, 14, 15, 16, 20, 21])
        dep_time = f"2026-11-14T{dep_hour:02d}:00:00"

        cabin_info = {
            "economy":         {"price_usd": f_price,   "miles_required": econ_miles, "seats_left": rng.randint(4,30)},
            "premium_economy": {"price_usd": pe_price,  "miles_required": int(pe_price/0.013), "seats_left": rng.randint(2,10)},
            "business":        {"price_usd": biz_price, "miles_required": biz_miles, "seats_left": rng.randint(1,6)},
        }

        row = {
            "id": f"{al['id_prefix']}{500+i}",
            "airline": al["airline"],
            "loyalty_program": al["program"],
            "origin": origin,
            "destination": destination,
            "departure": dep_time,
            "duration_minutes": dur,
            "stops": stops,
            "aircraft": rng.choice(["Boeing 737-900","Airbus A320","Boeing 787-9","Airbus A321"]),
        }
        row["cabin_info"] = {cabin_class: cabin_info[cabin_class]} if cabin_class and cabin_class in cabin_info else cabin_info
        results.append(row)

    return results


def _generate_hotels(city: str, check_in: str, check_out: str, min_stars: int = 1,
                     max_price: float | None = None, pet_friendly: bool | None = None,
                     preferred_programs: list | None = None, trip_type: str | None = None) -> list[dict]:
    """Generate plausible mock hotels for any city."""
    real = [h for h in HOTELS if h["city"].lower() == city.lower()]
    if not real:
        # Generate synthetic hotel list
        rng = _seed_rand(city)
        tier_names = {
            5: ["Grand Hyatt", "Four Seasons", "Ritz-Carlton", "Waldorf Astoria", "Park Hyatt"],
            4: ["Marriott", "Hilton", "Westin", "Sheraton", "Renaissance"],
            3: ["Courtyard by Marriott", "Hampton Inn", "Aloft", "Hyatt Place"],
        }
        templates = [
            (5, "World of Hyatt",      0.0170, 75000,  False),
            (5, "Marriott Bonvoy",     0.0080, 60000,  False),
            (4, "Hilton Honors",       0.0050, 40000,  True),
            (4, "Marriott Bonvoy",     0.0080, 30000,  True),
            (3, "World of Hyatt",      0.0170, 15000,  True),
            (3, "IHG One Rewards",     0.0050, 20000,  False),
        ]
        for stars, program, cpp, pts, pet in templates:
            name_pool = tier_names.get(stars, ["Hotel"])
            base_price = {5: 350, 4: 180, 3: 90}[stars]
            price = int(base_price * rng.uniform(0.8, 1.4))
            real.append({
                "id": f"GEN_{city[:3].upper()}_{stars}",
                "name": f"{rng.choice(name_pool)} {city.title()}",
                "city": city.title(),
                "neighborhood": "City Center",
                "stars": stars,
                "loyalty_program": program,
                "price_per_night": price,
                "points_per_night": pts,
                "amenities": ["wifi","gym","pool","restaurant"] + (["spa","concierge"] if stars == 5 else []),
                "pet_friendly": pet,
                "cancellation_policy": "free_48h",
                "description": f"{'Luxury' if stars==5 else 'Comfortable'} property in {city.title()}.",
            })

    # Filters
    if min_stars > 1:
        real = [h for h in real if h.get("stars", 3) >= min_stars]
    if max_price:
        real = [h for h in real if h.get("price_per_night", 9999) <= max_price]
    if pet_friendly:
        real = [h for h in real if h.get("pet_friendly", False)]

    # Nights calculation
    try:
        nights = (datetime.strptime(check_out, "%Y-%m-%d") - datetime.strptime(check_in, "%Y-%m-%d")).days
    except ValueError:
        nights = 7

    preferred_programs = preferred_programs or []
    real = sorted(real, key=lambda h: (h["loyalty_program"] not in preferred_programs, h.get("price_per_night", 9999)))

    output = []
    for h in real:
        row = dict(h)
        row["total_price"] = h["price_per_night"] * nights
        row["nights"] = nights
        output.append(row)
    return output


# ──────────────────────────────────────────────────────────────────────────────
# Tool handlers
# ──────────────────────────────────────────────────────────────────────────────

def handle_get_user_profile(**_) -> dict:
    return _memory.get_profile()


def handle_update_user_profile(**kwargs) -> dict:
    _memory.update(kwargs)
    return {"status": "saved", "updated_fields": list(kwargs.keys())}


def handle_add_traveler(**kwargs) -> dict:
    travelers = _memory.profile.get("travelers", [{"name": "", "age": None, "passport_country": "US"}])
    travelers.append(kwargs)
    _memory.update({"travelers": travelers})
    return {"status": "added", "traveler": kwargs, "total_travelers": len(travelers)}


def handle_update_trip_context(**kwargs) -> dict:
    # Resolve IATA codes
    kwargs["origin_iata"]      = _resolve_iata(kwargs.get("origin", ""))
    kwargs["destination_iata"] = _resolve_iata(kwargs.get("destination", ""))
    _memory.update({"current_trip": kwargs})
    return {"status": "saved", "trip": kwargs}


def handle_search_flights(origin: str, destination: str, departure_date: str,
                          cabin_class: str = None, num_passengers: int = 1,
                          preferred_airlines: list = None, nonstop_only: bool = False,
                          max_price_pp: float = None, **_) -> dict:
    origin_iata = _resolve_iata(origin)
    dest_iata   = _resolve_iata(destination)
    results = _generate_flights(origin_iata, dest_iata, cabin_class,
                                preferred_airlines, nonstop_only, max_price_pp)
    if not results:
        return {"flights": [], "message": f"No flights found from {origin} to {destination}"}
    return {"flights": results, "origin": origin_iata, "destination": dest_iata,
            "searched_date": departure_date, "passengers": num_passengers}


def handle_search_hotels(city: str, check_in: str, check_out: str,
                          min_stars: int = 1, max_price_per_night: float = None,
                          pet_friendly: bool = None, preferred_programs: list = None,
                          trip_type: str = None, **_) -> dict:
    results = _generate_hotels(city, check_in, check_out, min_stars,
                                max_price_per_night, pet_friendly,
                                preferred_programs, trip_type)
    if not results:
        return {"hotels": [], "message": f"No hotels found in {city} matching your filters"}
    return {"hotels": results, "city": city, "check_in": check_in, "check_out": check_out}


def handle_evaluate_all_redemptions(cash_price: float, item_type: str,
                                     description: str = "", **_) -> dict:
    programs = _memory.profile.get("loyalty_programs", {})
    if not programs:
        return {"error": "No loyalty programs in profile. Ask the user to share their program balances."}
    options = evaluate_redemption_options(programs, cash_price, item_type)
    return {
        "cash_price": cash_price,
        "description": description,
        "evaluation": options,
        "tip": "Options showing can_cover=True with cpp >= 1.5 are good redemptions.",
    }


def handle_check_miles_redemption(item_id: str, item_type: str, loyalty_program: str,
                                   user_balance: float, cabin_class: str = None, **_) -> dict:
    if item_type == "flight":
        flight = get_flight_by_id(item_id)
        if not flight:
            return {"error": f"Flight {item_id} not in mock data. Use evaluate_all_redemptions for dynamic routes."}
        cabin = cabin_class or "economy"
        info  = flight["cabin_classes"].get(cabin, {})
        cash  = info.get("price_usd", 0)
        miles = info.get("miles_required", 0)
        if not miles:
            return {"can_redeem": False, "reason": "No miles data for this flight/cabin"}
        cpp = round((cash / miles) * 100, 2)
        return {"item": f"{flight['airline']} {item_id} ({cabin})", "cash_price_usd": cash,
                "miles_required": miles, "can_afford": user_balance >= miles,
                "cents_per_point": cpp,
                "verdict": "good redemption ✅" if cpp >= 1.5 else "poor redemption ❌",
                "recommendation": f"Use miles — saves ${cash} at {cpp}¢/pt" if cpp >= 1.5 else f"Pay cash — only {cpp}¢/pt"}
    else:
        hotel = get_hotel_by_id(item_id)
        if not hotel:
            return {"error": f"Hotel {item_id} not found. Use evaluate_all_redemptions for general assessment."}
        pts   = hotel.get("points_per_night", 0)
        cash  = hotel.get("price_per_night", 0)
        if not pts:
            return {"can_redeem": False, "reason": "No points redemption for this hotel"}
        cpp = round((cash / pts) * 100, 2)
        return {"item": hotel["name"], "cash_per_night": cash, "points_per_night": pts,
                "can_afford": user_balance >= pts, "cents_per_point": cpp,
                "verdict": "good redemption ✅" if cpp >= 1.5 else "poor redemption ❌"}


def handle_get_loyalty_program_info(program_name: str, **_) -> dict:
    from loyalty import get_program
    prog = get_program(program_name)
    if not prog:
        return {"error": f"Program '{program_name}' not found. Available: {', '.join(ALL_PROGRAM_NAMES[:10])}..."}
    return {"program": program_name, **prog}


_DESTINATION_DB = {
    "CUN": {
        "name": "Cancun / Riviera Maya",
        "best_months": ["November","December","January","February","March"],
        "avoid_months": ["September","October"],
        "sargassum_risk": {
            "November": "Low — season ends Oct/Nov",
            "December": "Very Low",
            "January":  "Very Low (2026 saw early arrivals — check tracker)",
            "February": "Very Low",
            "March":    "Low — season starting",
            "April":    "Low–Moderate",
            "May":      "Moderate",
            "June":     "High — peak season",
            "July":     "High — worst months",
            "August":   "High — worst months",
            "September":"Moderate + hurricane risk",
            "October":  "Moderate",
        },
        "best_deals_months": ["November","January","October"],
        "weather": "Tropical. Dry season Nov–Apr (25–30°C), rainy/hurricane Jun–Nov.",
        "visa_us": "No visa required. FMM tourist card issued at airport (~$30 or included in airfare).",
        "tips": [
            "Puerto Morelos beaches are reef-protected — better sargassum resistance than Tulum",
            "2026 forecasting record sargassum year; monitor howisthesargassum.com",
            "Book Palmaïa 3+ nights for free night deal",
        ],
    },
    "CDG": {
        "name": "Paris",
        "best_months": ["April","May","September","October"],
        "avoid_months": ["July","August"],
        "weather": "Temperate. Spring/Fall ideal. July–Aug hot + very crowded.",
        "visa_us": "No visa required for stays under 90 days (Schengen).",
        "tips": ["Book museums in advance in summer", "Shoulder season (May, Sep) has best value"],
    },
    "NRT": {
        "name": "Tokyo",
        "best_months": ["March","April","October","November"],
        "weather": "Temperate. Cherry blossom (Mar–Apr) and fall foliage (Oct–Nov) are peak seasons.",
        "visa_us": "No visa required for stays under 90 days.",
        "tips": ["Book cherry blossom season 6+ months ahead", "IC Suica card for transport"],
    },
    "LHR": {
        "name": "London",
        "best_months": ["May","June","September"],
        "weather": "Mild and rainy year-round. Summer (Jun–Aug) warmest.",
        "visa_us": "No visa required for stays under 6 months (ETA required from 2024, ~$10).",
        "tips": ["Oyster card for Tube", "Museums free; book time slots"],
    },
    "DXB": {
        "name": "Dubai",
        "best_months": ["October","November","December","January","February","March"],
        "avoid_months": ["June","July","August"],
        "weather": "Desert. Extreme heat Jun–Sep (40°C+). Oct–Apr is ideal.",
        "visa_us": "Visa on arrival, 30 days free.",
        "tips": ["Emirates Skywards redemptions excellent for first class", "Book hotels on Sheikh Zayed Rd"],
    },
}

def handle_check_destination_insights(destination: str, travel_month: str,
                                       trip_type: str = None, origin_country: str = "US", **_) -> dict:
    dest_iata = _resolve_iata(destination)
    info = _DESTINATION_DB.get(dest_iata)
    if not info:
        # Generic fallback
        return {
            "destination": destination,
            "travel_month": travel_month,
            "note": "Detailed destination data not in local DB — Claude's general knowledge applies.",
            "general_advice": [
                "Check US State Dept travel advisories at travel.state.gov",
                "Verify entry requirements at iatatravelcentre.com",
                "Consider travel insurance for medical + cancellation coverage",
            ]
        }
    month_name = travel_month.capitalize()
    result = {
        "destination": info["name"],
        "travel_month": month_name,
        "best_months": info.get("best_months", []),
        "weather": info.get("weather", ""),
        "visa_us": info.get("visa_us", "Check iatatravelcentre.com"),
        "tips": info.get("tips", []),
    }
    if "sargassum_risk" in info:
        result["sargassum_risk"] = info["sargassum_risk"].get(month_name, "Unknown")
    sarg_level = result.get("sargassum_risk", "")
    is_bad_month = month_name in info.get("avoid_months", [])
    result["overall_rating"] = "⚠️ Non-ideal month" if is_bad_month else ("✅ Great time to visit" if month_name in info.get("best_months", []) else "👍 Decent time to visit")
    if info.get("best_deals_months"):
        result["deal_rating"] = "✅ One of the cheapest months" if month_name in info["best_deals_months"] else "Standard pricing"
    return result


def handle_suggest_optimal_dates(destination: str, trip_type: str = None,
                                  avoid_crowds: bool = False, budget_focus: bool = False,
                                  num_nights: int = 7, **_) -> dict:
    dest_iata = _resolve_iata(destination)
    info = _DESTINATION_DB.get(dest_iata, {})
    best = info.get("best_months", ["November","January","February"])
    deals = info.get("best_deals_months", ["November","January"])

    windows = []
    if budget_focus:
        priority = deals
    elif avoid_crowds:
        priority = [m for m in best if m not in ["July","August","March","December"]]
    else:
        priority = [m for m in best if m in deals] or best

    for month in priority[:3]:
        windows.append({
            "window": f"{month} 2026",
            "sargassum": info.get("sargassum_risk", {}).get(month, "N/A"),
            "deal_rating": "✅ Cheap" if month in deals else "Standard",
            "weather": "Best season" if month in best else "OK",
            "recommendation": f"Consider {month} 10–20 for best combination of price and conditions",
        })
    return {"destination": destination, "optimal_windows": windows,
            "nights_requested": num_nights, "best_months": best}


def handle_reflect_on_options(flight_comparison: str, hotel_comparison: str,
                               redemption_strategy: str, recommendation: str,
                               alignment_with_goals: str = "", warnings: str = "", **_) -> dict:
    return {
        "status": "reflection_complete",
        "flight_analysis":       flight_comparison,
        "hotel_analysis":        hotel_comparison,
        "redemption_strategy":   redemption_strategy,
        "alignment_with_goals":  alignment_with_goals,
        "final_recommendation":  recommendation,
        "warnings":              warnings,
    }


def handle_build_itinerary(outbound_flight_id: str, hotel_id: str, cabin_class: str,
                            return_flight_id: str = None, num_travelers: int = 1,
                            use_miles_flight: bool = False, use_points_hotel: bool = False,
                            miles_program: str = "", points_program: str = "",
                            notes: str = "", **_) -> dict:
    out_flight = get_flight_by_id(outbound_flight_id)
    ret_flight = get_flight_by_id(return_flight_id) if return_flight_id else None
    hotel      = get_hotel_by_id(hotel_id)

    # Handle dynamic (non-mock) flights/hotels
    if not out_flight:
        out_flight = {"id": outbound_flight_id, "airline": "Selected Airline",
                      "origin": "?", "destination": "?", "arrival": "2026-11-14",
                      "cabin_classes": {cabin_class: {"price_usd": 0, "miles_required": 0}}}
    if not hotel:
        hotel = {"id": hotel_id, "name": "Selected Hotel", "neighborhood": "",
                 "stars": 4, "price_per_night": 0, "points_per_night": 0}

    cabin_info_out = out_flight.get("cabin_classes", {}).get(cabin_class, {})
    cabin_info_ret = ret_flight.get("cabin_classes", {}).get(cabin_class, {}) if ret_flight else {}

    flight_cash  = 0 if use_miles_flight else (
        (cabin_info_out.get("price_usd", 0) + cabin_info_ret.get("price_usd", 0)) * num_travelers
    )
    flight_miles = (
        (cabin_info_out.get("miles_required", 0) + cabin_info_ret.get("miles_required", 0)) * num_travelers
    ) if use_miles_flight else 0

    try:
        nights = (
            datetime.strptime(ret_flight["departure"][:10], "%Y-%m-%d") -
            datetime.strptime(out_flight.get("arrival", out_flight.get("departure", "2026-11-14"))[:10], "%Y-%m-%d")
        ).days if ret_flight else 7
        nights = max(nights, 1)
    except Exception:
        nights = 7

    hotel_cash   = 0 if use_points_hotel else hotel["price_per_night"] * nights * num_travelers
    hotel_points = hotel["points_per_night"] * nights if use_points_hotel else 0

    itinerary_id = f"IT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    itin = {
        "id": itinerary_id,
        "outbound_flight": f"{out_flight.get('airline','?')} {outbound_flight_id}",
        "return_flight":   (f"{ret_flight['airline']} {return_flight_id}" if ret_flight else None),
        "hotel":       f"{hotel['name']}, {hotel.get('neighborhood','')}, {hotel.get('stars',4)}★",
        "cabin_class": cabin_class,
        "nights":      nights,
        "travelers":   num_travelers,
        "total_cash_usd":     flight_cash + hotel_cash,
        "flight_miles_used":  flight_miles,
        "hotel_points_used":  hotel_points,
        "miles_program":      miles_program,
        "points_program":     points_program,
        "notes":  notes,
        "status": "pending_approval",
    }
    _itinerary_store[itinerary_id] = itin
    return itin


_BOOKING_URLS = {
    "United":    "https://www.united.com/en/us/flights/book",
    "JetBlue":   "https://www.jetblue.com/en/book",
    "Delta":     "https://www.delta.com/us/en/flight-search/book-a-flight",
    "American":  "https://www.aa.com/booking/find-flights",
    "Southwest": "https://www.southwest.com/air/booking/",
    "Spirit":    "https://www.spirit.com/en/",
    "Marriott":  "https://www.marriott.com/search/default.mi",
    "Hilton":    "https://www.hilton.com/en/hilton-honors/redeem/",
    "Hyatt":     "https://world.hyatt.com/content/gp/en/rewards/redeem-points.html",
    "IHG":       "https://www.ihg.com/rewardsclub/us/en/redeem",
}

def handle_generate_booking_links(itinerary_id: str, **_) -> dict:
    itin = _itinerary_store.get(itinerary_id)
    if not itin:
        return {"error": f"Itinerary {itinerary_id} not found — call build_itinerary first."}
    airline = itin.get("outbound_flight", "").split()[0] if itin.get("outbound_flight") else ""
    hotel_name = itin.get("hotel", "")
    hotel_chain = next((k for k in _BOOKING_URLS if k.lower() in hotel_name.lower()), "Marriott")
    links = {
        "outbound_flight": _BOOKING_URLS.get(airline, "https://google.com/flights"),
        "hotel":           _BOOKING_URLS.get(hotel_chain, "https://hotels.com"),
        "google_flights":  f"https://www.google.com/flights",
        "note": "Open each link, search the same dates, and complete checkout. You enter payment details on the final page.",
    }
    if itin.get("return_flight"):
        links["return_flight"] = links["outbound_flight"]
    itin["booking_links"] = links
    itin["status"] = "ready_to_book"
    _itinerary_store[itinerary_id] = itin
    return {"itinerary_id": itinerary_id, "booking_links": links}


def handle_add_deal_alert(description: str, origin: str, destination: str,
                           travel_month: str = None, max_price_target: float = None,
                           hotel_id: str = None, max_hotel_rate: float = None,
                           award_alert: bool = False, preferred_cabin: str = None,
                           alert_email: str = None, **_) -> dict:
    email = alert_email or _memory.profile.get("email", "")
    if not email:
        return {"error": "No email on file. Ask the user for their email address first, save it with update_user_profile."}

    watch = {
        "description":      description,
        "origin":           _resolve_iata(origin),
        "destination":      _resolve_iata(destination),
        "travel_month":     travel_month,
        "max_price_target": max_price_target,
        "hotel_id":         hotel_id,
        "max_hotel_rate":   max_hotel_rate,
        "award_alert":      award_alert,
        "preferred_cabin":  preferred_cabin,
        "alert_email":      email,
    }
    watch_id = _memory.add_watch(watch)
    return {
        "status": "watch_created",
        "watch_id": watch_id,
        "description": description,
        "alert_email": email,
        "triggers": {
            "price_alert": f"Round-trip under ${max_price_target}" if max_price_target else "Not set",
            "hotel_alert": f"Nightly rate under ${max_hotel_rate}" if max_hotel_rate else "Not set",
            "award_alert": f"Award space opens ({preferred_cabin})" if award_alert else "Not set",
        },
        "message": f"✅ Watch set! I'll check this route every hour and email {email} when a trigger fires.",
    }


# ──────────────────────────────────────────────────────────────────────────────
# Dispatch table
# ──────────────────────────────────────────────────────────────────────────────

HANDLERS = {
    "get_user_profile":           handle_get_user_profile,
    "update_user_profile":        handle_update_user_profile,
    "add_traveler":               handle_add_traveler,
    "update_trip_context":        handle_update_trip_context,
    "search_flights":             handle_search_flights,
    "search_hotels":              handle_search_hotels,
    "evaluate_all_redemptions":   handle_evaluate_all_redemptions,
    "check_miles_redemption":     handle_check_miles_redemption,
    "get_loyalty_program_info":   handle_get_loyalty_program_info,
    "check_destination_insights": handle_check_destination_insights,
    "suggest_optimal_dates":      handle_suggest_optimal_dates,
    "reflect_on_options":         handle_reflect_on_options,
    "build_itinerary":            handle_build_itinerary,
    "generate_booking_links":     handle_generate_booking_links,
    "add_deal_alert":             handle_add_deal_alert,
}


def execute_tool(name: str, tool_input: dict):
    handler = HANDLERS.get(name)
    if not handler:
        return {"error": f"Unknown tool: {name}. Available: {list(HANDLERS.keys())}"}
    return handler(**tool_input)
