"""
Realistic mock flight and hotel data for demo purposes.
Mirrors Amadeus / Booking.com API response shapes.
"""

FLIGHTS = [
    {
        "id": "UA901",
        "airline": "United",
        "loyalty_program": "United MileagePlus",
        "origin": "SFO",
        "destination": "CDG",
        "departure": "2025-08-10T10:30:00",
        "arrival": "2025-08-11T07:15:00",
        "duration_minutes": 645,
        "stops": 0,
        "aircraft": "Boeing 787-9",
        "cabin_classes": {
            "economy":          {"price_usd": 1050, "miles_required": 30000, "seats_left": 12},
            "premium_economy":  {"price_usd": 2100, "miles_required": 60000, "seats_left": 4},
            "business":         {"price_usd": 5200, "miles_required": 110000, "seats_left": 2},
        },
    },
    {
        "id": "AF076",
        "airline": "Air France",
        "loyalty_program": "Flying Blue",
        "origin": "SFO",
        "destination": "CDG",
        "departure": "2025-08-10T15:45:00",
        "arrival": "2025-08-11T12:30:00",
        "duration_minutes": 645,
        "stops": 0,
        "aircraft": "Airbus A350",
        "cabin_classes": {
            "economy":          {"price_usd": 980,  "miles_required": 28000, "seats_left": 20},
            "premium_economy":  {"price_usd": 1900, "miles_required": 55000, "seats_left": 6},
            "business":         {"price_usd": 4800, "miles_required": 95000, "seats_left": 3},
        },
    },
    {
        "id": "DL402",
        "airline": "Delta",
        "loyalty_program": "SkyMiles",
        "origin": "SFO",
        "destination": "CDG",
        "departure": "2025-08-10T22:00:00",
        "arrival": "2025-08-11T18:45:00",
        "duration_minutes": 705,
        "stops": 1,
        "layover": "JFK (1h 45m)",
        "aircraft": "Airbus A330",
        "cabin_classes": {
            "economy":          {"price_usd": 820,  "miles_required": 25000, "seats_left": 30},
            "premium_economy":  {"price_usd": 1650, "miles_required": 50000, "seats_left": 8},
            "business":         {"price_usd": 4200, "miles_required": 85000, "seats_left": 5},
        },
    },
    # Return flights CDG → SFO
    {
        "id": "UA902",
        "airline": "United",
        "loyalty_program": "United MileagePlus",
        "origin": "CDG",
        "destination": "SFO",
        "departure": "2025-08-17T11:00:00",
        "arrival": "2025-08-17T14:30:00",
        "duration_minutes": 690,
        "stops": 0,
        "aircraft": "Boeing 787-9",
        "cabin_classes": {
            "economy":          {"price_usd": 980,  "miles_required": 30000, "seats_left": 10},
            "premium_economy":  {"price_usd": 1950, "miles_required": 60000, "seats_left": 4},
            "business":         {"price_usd": 5000, "miles_required": 110000, "seats_left": 2},
        },
    },
    {
        "id": "AF075",
        "airline": "Air France",
        "loyalty_program": "Flying Blue",
        "origin": "CDG",
        "destination": "SFO",
        "departure": "2025-08-17T14:15:00",
        "arrival": "2025-08-17T17:45:00",
        "duration_minutes": 690,
        "stops": 0,
        "aircraft": "Airbus A350",
        "cabin_classes": {
            "economy":          {"price_usd": 920,  "miles_required": 28000, "seats_left": 18},
            "business":         {"price_usd": 4600, "miles_required": 95000, "seats_left": 4},
        },
    },
    {
        "id": "DL403",
        "airline": "Delta",
        "loyalty_program": "SkyMiles",
        "origin": "CDG",
        "destination": "SFO",
        "departure": "2025-08-17T09:30:00",
        "arrival": "2025-08-17T13:00:00",
        "duration_minutes": 750,
        "stops": 1,
        "layover": "ATL (2h 15m)",
        "aircraft": "Boeing 767",
        "cabin_classes": {
            "economy":          {"price_usd": 790,  "miles_required": 25000, "seats_left": 25},
            "business":         {"price_usd": 3900, "miles_required": 85000, "seats_left": 6},
        },
    },
]

HOTELS = [
    {
        "id": "RP001",
        "name": "Le Royal Monceau – Raffles Paris",
        "city": "Paris",
        "neighborhood": "8th Arrondissement",
        "stars": 5,
        "loyalty_program": "Accor Le Club",
        "price_per_night": 950,
        "points_per_night": 80000,
        "amenities": ["spa", "pool", "gym", "concierge", "butler", "pet_friendly", "wifi", "restaurant"],
        "pet_friendly": True,
        "cancellation_policy": "free_48h",
        "description": "Palace hotel steps from the Champs-Élysées with Picasso-designed interiors.",
    },
    {
        "id": "MP001",
        "name": "Marriott Paris Champs-Élysées",
        "city": "Paris",
        "neighborhood": "8th Arrondissement",
        "stars": 5,
        "loyalty_program": "Marriott Bonvoy",
        "price_per_night": 720,
        "points_per_night": 60000,
        "amenities": ["gym", "concierge", "wifi", "restaurant", "bar"],
        "pet_friendly": False,
        "cancellation_policy": "free_72h",
        "description": "Full-service Marriott with views of the Eiffel Tower, 5 min walk to Arc de Triomphe.",
    },
    {
        "id": "HI001",
        "name": "Hilton Paris Opéra",
        "city": "Paris",
        "neighborhood": "9th Arrondissement",
        "stars": 4,
        "loyalty_program": "Hilton Honors",
        "price_per_night": 420,
        "points_per_night": 40000,
        "amenities": ["gym", "wifi", "restaurant", "bar", "business_center"],
        "pet_friendly": True,
        "cancellation_policy": "free_24h",
        "description": "Classic Haussmann building near Opéra Garnier, great value for central Paris.",
    },
    {
        "id": "IB001",
        "name": "Ibis Paris Centre Tour Eiffel",
        "city": "Paris",
        "neighborhood": "15th Arrondissement",
        "stars": 3,
        "loyalty_program": "Accor Le Club",
        "price_per_night": 185,
        "points_per_night": 15000,
        "amenities": ["wifi", "bar", "24h_reception"],
        "pet_friendly": True,
        "cancellation_policy": "free_24h",
        "description": "Budget-friendly option with Eiffel Tower views, 10 min walk to the tower.",
    },
    {
        "id": "FP001",
        "name": "Four Seasons Hotel George V",
        "city": "Paris",
        "neighborhood": "8th Arrondissement",
        "stars": 5,
        "loyalty_program": "Four Seasons Preferred",
        "price_per_night": 1400,
        "points_per_night": 0,
        "amenities": ["spa", "pool", "gym", "concierge", "butler", "pet_friendly", "wifi", "3_restaurants", "florist"],
        "pet_friendly": True,
        "cancellation_policy": "free_7_days",
        "description": "Legendary palace hotel with three Michelin-starred restaurants and iconic flower arrangements.",
    },
    {
        "id": "MB001",
        "name": "Mercure Paris Montmartre Sacré-Coeur",
        "city": "Paris",
        "neighborhood": "Montmartre",
        "stars": 4,
        "loyalty_program": "Accor Le Club",
        "price_per_night": 280,
        "points_per_night": 25000,
        "amenities": ["wifi", "restaurant", "bar", "terrace"],
        "pet_friendly": False,
        "cancellation_policy": "free_48h",
        "description": "Boutique hotel in bohemian Montmartre with rooftop terrace overlooking Sacré-Coeur.",
    },
]


def get_flights_by_route(origin: str, destination: str) -> list[dict]:
    origin = origin.upper()
    destination = destination.upper()
    return [f for f in FLIGHTS if f["origin"] == origin and f["destination"] == destination]


def get_hotel_by_id(hotel_id: str) -> dict | None:
    return next((h for h in HOTELS if h["id"] == hotel_id), None)


def get_flight_by_id(flight_id: str) -> dict | None:
    return next((f for f in FLIGHTS if f["id"] == flight_id), None)
