"""
Tool definitions for the travel agent.
Each tool has two parts:
  1. A Claude API schema (in TOOL_SCHEMAS) describing inputs/outputs for the LLM.
  2. A Python handler function that executes the mock logic.
"""

import json
from datetime import datetime
from mock_data import FLIGHTS, HOTELS, get_flights_by_route, get_flight_by_id, get_hotel_by_id


# ──────────────────────────────────────────────
# Claude tool schemas
# ──────────────────────────────────────────────

TOOL_SCHEMAS = [
    {
        "name": "get_user_profile",
        "description": (
            "Retrieve the user's stored travel preferences, loyalty program balances, "
            "preferred airlines/hotels, and past trip history. Call this first in every session."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "update_user_profile",
        "description": (
            "Persist new or updated user preferences so they are remembered in future sessions. "
            "Call this whenever the user mentions their loyalty program balances, preferred airlines, "
            "hotels, cabin class, seat preference, budget, dietary needs, or pet requirements."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name":                {"type": "string", "description": "User's first name"},
                "loyalty_programs":    {
                    "type": "object",
                    "description": "Dict of program name → points/miles balance, e.g. {\"United MileagePlus\": 125000}",
                    "additionalProperties": {"type": "number"},
                },
                "preferred_airlines":  {"type": "array", "items": {"type": "string"}},
                "preferred_hotels":    {"type": "array", "items": {"type": "string"}},
                "cabin_preference":    {
                    "type": "string",
                    "enum": ["economy", "premium_economy", "business", "first"],
                },
                "seat_preference":     {"type": "string", "enum": ["window", "aisle", "middle", "bulkhead"]},
                "budget_per_night":    {"type": "number", "description": "Max hotel spend per night in USD"},
                "dietary_restrictions":{"type": "array", "items": {"type": "string"}},
                "pet_friendly_required":{"type": "boolean"},
            },
            "required": [],
        },
    },
    {
        "name": "search_flights",
        "description": (
            "Search available flights between two airports on a given date. "
            "Returns all matching flights with prices in cash and miles for each cabin class."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "origin":           {"type": "string", "description": "3-letter IATA airport code, e.g. SFO"},
                "destination":      {"type": "string", "description": "3-letter IATA airport code, e.g. CDG"},
                "departure_date":   {"type": "string", "description": "Date in YYYY-MM-DD format"},
                "cabin_class":      {
                    "type": "string",
                    "enum": ["economy", "premium_economy", "business", "first"],
                    "description": "Filter results to this cabin class (optional)",
                },
                "preferred_airlines": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Rank these airlines first in results",
                },
            },
            "required": ["origin", "destination", "departure_date"],
        },
    },
    {
        "name": "search_hotels",
        "description": (
            "Search available hotels in a city for the given dates. "
            "Returns hotels with nightly price, loyalty points cost, amenities, and pet policy."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "city":              {"type": "string", "description": "Destination city, e.g. Paris"},
                "check_in":          {"type": "string", "description": "Check-in date YYYY-MM-DD"},
                "check_out":         {"type": "string", "description": "Check-out date YYYY-MM-DD"},
                "min_stars":         {"type": "integer", "enum": [1, 2, 3, 4, 5]},
                "max_price_per_night":{"type": "number", "description": "Maximum cash price per night in USD"},
                "pet_friendly":      {"type": "boolean"},
                "preferred_programs": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Rank hotels in these loyalty programs first",
                },
            },
            "required": ["city", "check_in", "check_out"],
        },
    },
    {
        "name": "check_miles_redemption",
        "description": (
            "Calculate the cents-per-point value of redeeming miles/points for a specific flight or hotel. "
            "Use this to decide whether paying cash or using loyalty points is better. "
            "A value ≥ 1.5 cents/point is generally considered a good redemption."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "item_id":        {"type": "string", "description": "Flight or hotel ID, e.g. UA901 or MP001"},
                "item_type":      {"type": "string", "enum": ["flight", "hotel"]},
                "cabin_class":    {"type": "string", "description": "Relevant cabin class for flights"},
                "loyalty_program":{"type": "string", "description": "Program to redeem from, e.g. United MileagePlus"},
                "user_balance":   {"type": "number", "description": "User's current points/miles balance"},
            },
            "required": ["item_id", "item_type", "loyalty_program", "user_balance"],
        },
    },
    {
        "name": "reflect_on_options",
        "description": (
            "REQUIRED: Call this before presenting any recommendations to the user. "
            "The agent uses this tool to think through all available options, compare them "
            "against the user's preferences and miles strategy, and decide what to recommend. "
            "This step is logged and shown to the user as the agent's reasoning."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "flight_comparison": {
                    "type": "string",
                    "description": "Compare outbound and return flight options: price, duration, miles value, airline preference",
                },
                "hotel_comparison": {
                    "type": "string",
                    "description": "Compare hotel options: price, stars, loyalty value, amenities, location",
                },
                "miles_strategy": {
                    "type": "string",
                    "description": "Should the user redeem miles for flights, hotels, both, or neither? Explain with cents-per-point math.",
                },
                "recommendation": {
                    "type": "string",
                    "description": "Final recommendation: which flight(s), which hotel, and why. State the total trip cost (cash + miles).",
                },
            },
            "required": ["flight_comparison", "hotel_comparison", "miles_strategy", "recommendation"],
        },
    },
    {
        "name": "build_itinerary",
        "description": "Assemble the final trip itinerary from selected flight and hotel IDs.",
        "input_schema": {
            "type": "object",
            "properties": {
                "outbound_flight_id": {"type": "string"},
                "return_flight_id":   {"type": "string"},
                "hotel_id":           {"type": "string"},
                "cabin_class":        {"type": "string", "enum": ["economy", "premium_economy", "business", "first"]},
                "use_miles_for_flight":   {"type": "boolean", "description": "Redeem miles for the flight?"},
                "use_points_for_hotel":   {"type": "boolean", "description": "Redeem points for the hotel?"},
                "notes":              {"type": "string", "description": "Any additional notes or special requests"},
            },
            "required": ["outbound_flight_id", "hotel_id", "cabin_class"],
        },
    },
    {
        "name": "generate_booking_links",
        "description": (
            "Generate direct booking URLs for the approved itinerary. "
            "These links take the user straight to the airline/hotel checkout page."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "itinerary_id": {"type": "string", "description": "The itinerary ID returned by build_itinerary"},
            },
            "required": ["itinerary_id"],
        },
    },
]


# ──────────────────────────────────────────────
# Tool handler functions
# ──────────────────────────────────────────────

_memory = None  # Injected by agent.py at startup


def set_memory(mem):
    global _memory
    _memory = mem


def handle_get_user_profile(**_) -> dict:
    return _memory.get_profile()


def handle_update_user_profile(**kwargs) -> dict:
    _memory.update(kwargs)
    return {"status": "saved", "updated_fields": list(kwargs.keys())}


def handle_search_flights(origin: str, destination: str, departure_date: str,
                           cabin_class: str = None, preferred_airlines: list = None, **_) -> dict:
    results = get_flights_by_route(origin, destination)
    if not results:
        return {"flights": [], "message": f"No flights found from {origin} to {destination}"}

    preferred_airlines = preferred_airlines or []
    results = sorted(results, key=lambda f: (f["airline"] not in preferred_airlines,
                                              min(v["price_usd"] for v in f["cabin_classes"].values())))

    output = []
    for f in results:
        row = {k: v for k, v in f.items() if k != "cabin_classes"}
        if cabin_class and cabin_class in f["cabin_classes"]:
            row["cabin_info"] = {cabin_class: f["cabin_classes"][cabin_class]}
        else:
            row["cabin_info"] = f["cabin_classes"]
        output.append(row)

    return {"flights": output, "searched_date": departure_date}


def handle_search_hotels(city: str, check_in: str, check_out: str,
                          min_stars: int = 1, max_price_per_night: float = None,
                          pet_friendly: bool = None, preferred_programs: list = None, **_) -> dict:
    results = [h for h in HOTELS if h["city"].lower() == city.lower()]

    if min_stars:
        results = [h for h in results if h["stars"] >= min_stars]
    if max_price_per_night:
        results = [h for h in results if h["price_per_night"] <= max_price_per_night]
    if pet_friendly:
        results = [h for h in results if h["pet_friendly"]]

    preferred_programs = preferred_programs or []
    results = sorted(results, key=lambda h: (h["loyalty_program"] not in preferred_programs,
                                              h["price_per_night"]))

    # Calculate nights
    try:
        nights = (datetime.strptime(check_out, "%Y-%m-%d") - datetime.strptime(check_in, "%Y-%m-%d")).days
    except ValueError:
        nights = 1

    for h in results:
        h = dict(h)
        h["total_price"] = h["price_per_night"] * nights
        h["nights"] = nights

    return {"hotels": results, "check_in": check_in, "check_out": check_out}


def handle_check_miles_redemption(item_id: str, item_type: str, loyalty_program: str,
                                   user_balance: float, cabin_class: str = None, **_) -> dict:
    if item_type == "flight":
        flight = get_flight_by_id(item_id)
        if not flight:
            return {"error": f"Flight {item_id} not found"}
        cabin = cabin_class or "economy"
        info = flight["cabin_classes"].get(cabin, {})
        cash_price = info.get("price_usd", 0)
        miles_needed = info.get("miles_required", 0)
        if miles_needed == 0:
            return {"can_redeem": False, "reason": "No miles redemption available for this flight/cabin"}
        cpp = round((cash_price / miles_needed) * 100, 2)
        can_afford = user_balance >= miles_needed
        return {
            "item": f"{flight['airline']} {item_id} ({cabin})",
            "cash_price_usd": cash_price,
            "miles_required": miles_needed,
            "user_balance": user_balance,
            "can_afford": can_afford,
            "cents_per_point": cpp,
            "verdict": "good redemption" if cpp >= 1.5 else "poor redemption",
            "recommendation": (
                f"Use miles — saves ${cash_price} at {cpp}¢/pt (above 1.5¢ threshold)"
                if cpp >= 1.5 else
                f"Pay cash — only {cpp}¢/pt value (below 1.5¢ threshold)"
            ),
        }
    else:  # hotel
        hotel = get_hotel_by_id(item_id)
        if not hotel:
            return {"error": f"Hotel {item_id} not found"}
        points_needed = hotel.get("points_per_night", 0)
        if points_needed == 0:
            return {"can_redeem": False, "reason": "No points redemption available for this hotel"}
        cash_price = hotel["price_per_night"]
        cpp = round((cash_price / points_needed) * 100, 2)
        can_afford = user_balance >= points_needed
        return {
            "item": f"{hotel['name']} ({hotel['loyalty_program']})",
            "cash_price_per_night": cash_price,
            "points_required_per_night": points_needed,
            "user_balance": user_balance,
            "can_afford": can_afford,
            "cents_per_point": cpp,
            "verdict": "good redemption" if cpp >= 1.5 else "poor redemption",
            "recommendation": (
                f"Use points — saves ${cash_price}/night at {cpp}¢/pt (above threshold)"
                if cpp >= 1.5 else
                f"Pay cash — only {cpp}¢/pt value (below 1.5¢ threshold)"
            ),
        }


def handle_reflect_on_options(flight_comparison: str, hotel_comparison: str,
                               miles_strategy: str, recommendation: str, **_) -> dict:
    return {
        "status": "reflection_complete",
        "flight_analysis": flight_comparison,
        "hotel_analysis": hotel_comparison,
        "miles_strategy": miles_strategy,
        "final_recommendation": recommendation,
    }


_itinerary_store: dict[str, dict] = {}


def handle_build_itinerary(outbound_flight_id: str, hotel_id: str, cabin_class: str,
                            return_flight_id: str = None, use_miles_for_flight: bool = False,
                            use_points_for_hotel: bool = False, notes: str = "", **_) -> dict:
    out_flight = get_flight_by_id(outbound_flight_id)
    ret_flight = get_flight_by_id(return_flight_id) if return_flight_id else None
    hotel = get_hotel_by_id(hotel_id)

    if not out_flight or not hotel:
        return {"error": "Invalid flight or hotel ID"}

    cabin_info_out = out_flight["cabin_classes"].get(cabin_class, {})
    cabin_info_ret = ret_flight["cabin_classes"].get(cabin_class, {}) if ret_flight else {}

    flight_cost = 0 if use_miles_for_flight else (
        cabin_info_out.get("price_usd", 0) + cabin_info_ret.get("price_usd", 0)
    )
    flight_miles = (
        cabin_info_out.get("miles_required", 0) + cabin_info_ret.get("miles_required", 0)
    ) if use_miles_for_flight else 0

    try:
        nights = (
            datetime.strptime(ret_flight["departure"][:10], "%Y-%m-%d") -
            datetime.strptime(out_flight["arrival"][:10], "%Y-%m-%d")
        ).days if ret_flight else 7
    except (ValueError, KeyError):
        nights = 7

    hotel_cost = 0 if use_points_for_hotel else hotel["price_per_night"] * nights
    hotel_points = hotel["points_per_night"] * nights if use_points_for_hotel else 0

    itinerary_id = f"IT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    itinerary = {
        "id": itinerary_id,
        "outbound_flight": f"{out_flight['airline']} {outbound_flight_id} — {out_flight['origin']} → {out_flight['destination']}",
        "return_flight": (f"{ret_flight['airline']} {return_flight_id} — {ret_flight['origin']} → {ret_flight['destination']}" if ret_flight else None),
        "hotel": f"{hotel['name']}, {hotel['neighborhood']}, {hotel['stars']}★",
        "cabin_class": cabin_class,
        "nights": nights,
        "total_cash_usd": flight_cost + hotel_cost,
        "total_miles_used": flight_miles,
        "total_points_used": hotel_points,
        "notes": notes,
        "status": "pending_approval",
    }
    _itinerary_store[itinerary_id] = itinerary
    return itinerary


def handle_generate_booking_links(itinerary_id: str, **_) -> dict:
    itinerary = _itinerary_store.get(itinerary_id)
    if not itinerary:
        return {"error": f"Itinerary {itinerary_id} not found. Call build_itinerary first."}

    # In production these would be real deep-link URLs with prefilled search params.
    # For demo purposes we return realistic-looking URLs.
    links = {
        "outbound_flight": "https://www.united.com/en/us/flights/book",
        "hotel": "https://www.marriott.com/search/default.mi",
        "note": (
            "Open each link, search for the same itinerary details, "
            "and proceed to checkout. Enter your payment details on the final page."
        ),
    }
    if itinerary.get("return_flight"):
        links["return_flight"] = "https://www.united.com/en/us/flights/book"

    itinerary["booking_links"] = links
    itinerary["status"] = "ready_to_book"
    _itinerary_store[itinerary_id] = itinerary
    return {"itinerary_id": itinerary_id, "booking_links": links}


# ──────────────────────────────────────────────
# Dispatch table
# ──────────────────────────────────────────────

HANDLERS = {
    "get_user_profile":       handle_get_user_profile,
    "update_user_profile":    handle_update_user_profile,
    "search_flights":         handle_search_flights,
    "search_hotels":          handle_search_hotels,
    "check_miles_redemption": handle_check_miles_redemption,
    "reflect_on_options":     handle_reflect_on_options,
    "build_itinerary":        handle_build_itinerary,
    "generate_booking_links": handle_generate_booking_links,
}


def execute_tool(name: str, tool_input: dict):
    handler = HANDLERS.get(name)
    if not handler:
        return {"error": f"Unknown tool: {name}"}
    return handler(**tool_input)
