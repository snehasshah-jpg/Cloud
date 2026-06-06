"""
Comprehensive loyalty program registry.

Covers all major airline, hotel, and transferable credit-card point programs.
Includes transfer partner graphs, typical redemption values, and sweet spots.
"""

# Typical cents-per-point (CPP) valuations (conservative estimates)
PROGRAMS = {
    # ── Airlines ────────────────────────────────────────────────────────────
    "United MileagePlus": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.35,
        "sweet_spots": [
            "Saver awards on partners (ANA, Lufthansa) at 70k miles business transatlantic",
            "Short-haul domestic saver starting at 5k miles one-way",
            "Europe economy nonstop from 30k miles",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)", "Marriott Bonvoy (3:1)", "Bilt Rewards (1:1)"],
        "partners": ["Air Canada", "ANA", "Lufthansa", "Singapore Airlines", "Turkish Airlines"],
        "booking_url": "https://www.united.com/en/us/book-a-flight/united-saver-awards",
    },
    "Delta SkyMiles": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.20,
        "sweet_spots": [
            "Flash sales (check delta.com/deals weekly)",
            "Partner awards on Virgin Atlantic, Korean Air, Air France",
        ],
        "transfer_in": ["Amex Membership Rewards (1:1)", "Marriott Bonvoy (3:1)"],
        "partners": ["Air France", "KLM", "Virgin Atlantic", "Korean Air", "WestJet"],
        "booking_url": "https://www.delta.com/us/en/skymiles/redeem-miles/book-a-trip",
    },
    "American AAdvantage": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.40,
        "sweet_spots": [
            "Business class to Europe on partner Finnair/Iberia from 57.5k miles",
            "Partner awards on Japan Airlines, Cathay Pacific",
            "Off-peak domestic from 7.5k miles",
        ],
        "transfer_in": ["Citi ThankYou (1:1)", "Bilt Rewards (1:1)"],
        "partners": ["British Airways", "Finnair", "Iberia", "Japan Airlines", "Cathay Pacific"],
        "booking_url": "https://www.aa.com/aadvantage/redeemMiles/flights",
    },
    "JetBlue TrueBlue": {
        "type": "airline",
        "currency": "points",
        "typical_cpp": 1.30,
        "sweet_spots": [
            "Mint business class from 35k points one-way",
            "Flexible redemption — no saver/standard buckets",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)", "Amex Membership Rewards (1:1)", "Citi ThankYou (1:1)", "Bilt Rewards (1:1)"],
        "partners": ["Emirates (transfer out only)"],
        "booking_url": "https://www.jetblue.com/en/book/redeem",
    },
    "Southwest Rapid Rewards": {
        "type": "airline",
        "currency": "points",
        "typical_cpp": 1.50,
        "sweet_spots": [
            "All fares eligible — best at high cash prices",
            "Companion Pass covers 100% of companion flights",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)"],
        "partners": [],
        "booking_url": "https://www.southwest.com/air/booking/",
    },
    "Alaska Mileage Plan": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.80,
        "sweet_spots": [
            "Business class to Japan on Japan Airlines: 70k miles",
            "First class to Hawaii from 12.5k miles on Alaska metal",
            "Cathay Pacific business (JFK-HKG) from 70k miles",
        ],
        "transfer_in": ["Marriott Bonvoy (3:1)", "Bilt Rewards (1:1)"],
        "partners": ["American Airlines", "British Airways", "Cathay Pacific", "Japan Airlines", "Finnair"],
        "booking_url": "https://www.alaskaair.com/content/mileage-plan/use-miles/award-travel",
    },
    "Air Canada Aeroplan": {
        "type": "airline",
        "currency": "points",
        "typical_cpp": 1.50,
        "sweet_spots": [
            "Business class to Europe from 60k points (no fuel surcharges on most partners)",
            "Stopover awards allow free stopovers in Canada",
            "Star Alliance redemptions with no carrier surcharges",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)", "Amex Membership Rewards (1:1)", "Capital One Miles (1:1)", "Bilt Rewards (1:1)"],
        "partners": ["United", "Lufthansa", "ANA", "Singapore Airlines", "Turkish Airlines"],
        "booking_url": "https://www.aircanada.com/us/en/aco/home/aeroplan/redeem.html",
    },
    "British Airways Executive Club (Avios)": {
        "type": "airline",
        "currency": "avios",
        "typical_cpp": 1.50,
        "sweet_spots": [
            "Short-haul AA flights from 7.5k Avios",
            "Iberia long-haul business from 34k Avios (no fuel surcharge)",
            "Alaska flights from 10k Avios",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)", "Amex Membership Rewards (1:1)", "Capital One Miles (1:1)", "Citi ThankYou (1:1)", "Bilt Rewards (1:1)"],
        "partners": ["American Airlines", "Alaska Airlines", "Iberia", "Finnair", "Cathay Pacific"],
        "booking_url": "https://www.britishairways.com/en-us/executive-club/points/redeem-points",
    },
    "Air France/KLM Flying Blue": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.30,
        "sweet_spots": [
            "Monthly Promo Rewards: up to 50% off select routes",
            "Business class North America–Europe from 50k miles during promos",
        ],
        "transfer_in": ["Amex Membership Rewards (1:1)", "Chase Ultimate Rewards (1:1)", "Capital One Miles (1:1)", "Citi ThankYou (1:1)", "Bilt Rewards (1:1)"],
        "partners": ["Delta", "Kenya Airways", "Korean Air", "Middle East Airlines"],
        "booking_url": "https://www.airfranceklm.com/en/flying-blue/awards",
    },
    "Emirates Skywards": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.20,
        "sweet_spots": [
            "First class to Dubai/Asia from 150k miles",
            "Economy to Dubai from 45k miles",
        ],
        "transfer_in": ["Amex Membership Rewards (1:1)", "Citi ThankYou (1:1)", "Capital One Miles (1:1)"],
        "partners": ["flydubai", "Japan Airlines (select routes)"],
        "booking_url": "https://www.emirates.com/us/english/skywards/miles/spend-miles/flights.aspx",
    },
    "Singapore KrisFlyer": {
        "type": "airline",
        "currency": "miles",
        "typical_cpp": 1.70,
        "sweet_spots": [
            "Singapore Suites (First Class) from 95k miles one-way JFK-SIN",
            "Business class to Southeast Asia from 54k miles",
            "Star Alliance partner redemptions",
        ],
        "transfer_in": ["Amex Membership Rewards (1:1)", "Capital One Miles (1:1)", "Citi ThankYou (1:1)"],
        "partners": ["United", "Lufthansa", "ANA", "Air Canada"],
        "booking_url": "https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/redeem-miles/",
    },
    "Virgin Atlantic Flying Club": {
        "type": "airline",
        "currency": "points",
        "typical_cpp": 1.50,
        "sweet_spots": [
            "ANA First Class (NYC-Tokyo) from 120k points — one of best first-class deals",
            "Delta One business class from 50k points",
            "Upper Class transatlantic from 50k points",
        ],
        "transfer_in": ["Amex Membership Rewards (1:1)", "Chase Ultimate Rewards (1:1)", "Capital One Miles (1:1)", "Citi ThankYou (1:1)", "Bilt Rewards (1:1)"],
        "partners": ["Delta", "ANA", "Air New Zealand", "Singapore Airlines"],
        "booking_url": "https://flywithpoints.com/",
    },

    # ── Hotels ───────────────────────────────────────────────────────────────
    "Marriott Bonvoy": {
        "type": "hotel",
        "currency": "points",
        "typical_cpp": 0.80,
        "sweet_spots": [
            "Off-peak Category 1-4 properties: 7.5k–15k points/night",
            "Points + Cash rates for better value",
            "5th night free on award stays",
        ],
        "transfer_in": ["Amex Membership Rewards (3:1)", "Chase Ultimate Rewards (3:1)", "Capital One Miles (2:1.5)"],
        "transfer_out": ["Most airlines at 3:1 ratio (plus 5k bonus per 60k transfer)"],
        "booking_url": "https://www.marriott.com/loyalty/redeem/travel/findHotel.mi",
    },
    "Hilton Honors": {
        "type": "hotel",
        "currency": "points",
        "typical_cpp": 0.50,
        "sweet_spots": [
            "5th night free on standard award stays",
            "Points & Money rates often better than all-points",
            "Category 1-3 all-inclusive resorts in Caribbean",
        ],
        "transfer_in": ["Amex Membership Rewards (1:2)", "Capital One Miles (1:2)", "Citi ThankYou (1:2)"],
        "transfer_out": ["Virgin Atlantic (10:1.5 — poor)"],
        "booking_url": "https://www.hilton.com/en/hilton-honors/redeem/",
    },
    "World of Hyatt": {
        "type": "hotel",
        "currency": "points",
        "typical_cpp": 1.70,
        "sweet_spots": [
            "All-inclusive resorts (Secrets, Dreams) from 20k points/night",
            "Category 1-4 properties from 3.5k points/night",
            "Club access at top properties",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)", "Bilt Rewards (1:1)"],
        "transfer_out": ["American AAdvantage (5:2)"],
        "booking_url": "https://world.hyatt.com/content/gp/en/rewards/redeem-points.html",
    },
    "IHG One Rewards": {
        "type": "hotel",
        "currency": "points",
        "typical_cpp": 0.50,
        "sweet_spots": [
            "4th night free with IHG Premier card",
            "PointBreaks deals: select hotels from 5k points",
        ],
        "transfer_in": ["Chase Ultimate Rewards (1:1)"],
        "transfer_out": [],
        "booking_url": "https://www.ihg.com/rewardsclub/us/en/redeem",
    },
    "Wyndham Rewards": {
        "type": "hotel",
        "currency": "points",
        "typical_cpp": 0.90,
        "sweet_spots": [
            "Flat 15k points per night at most properties",
            "All-inclusive resorts with Wyndham's flat rate",
            "Vacasa vacation rentals with points",
        ],
        "transfer_in": ["Capital One Miles (1:1)"],
        "transfer_out": [],
        "booking_url": "https://www.wyndhamhotels.com/wyndham-rewards/redeem-points",
    },

    # ── Transferable / Credit Card ───────────────────────────────────────────
    "Chase Ultimate Rewards": {
        "type": "credit_card",
        "currency": "points",
        "typical_cpp": 2.00,
        "sweet_spots": [
            "Transfer to Hyatt at 1:1 — highest hotel value",
            "Transfer to United for Star Alliance partner awards",
            "Transfer to Aeroplan for no-surcharge partner awards",
            "Book directly via Chase Travel at 1.5¢/pt (Sapphire Reserve)",
        ],
        "transfer_partners": {
            "airlines": ["United MileagePlus (1:1)", "Southwest Rapid Rewards (1:1)", "JetBlue TrueBlue (1:1)", "British Airways Avios (1:1)", "Air France/KLM Flying Blue (1:1)", "Air Canada Aeroplan (1:1)", "Virgin Atlantic Flying Club (1:1)", "Iberia Plus (1:1)", "Singapore KrisFlyer (1:1)"],
            "hotels": ["World of Hyatt (1:1)", "IHG One Rewards (1:1)", "Marriott Bonvoy (1:1)"],
        },
        "cards": ["Sapphire Reserve", "Sapphire Preferred", "Ink Business Preferred"],
    },
    "Amex Membership Rewards": {
        "type": "credit_card",
        "currency": "points",
        "typical_cpp": 2.00,
        "sweet_spots": [
            "Transfer to Air Canada Aeroplan for business class without surcharges",
            "Transfer to ANA Mileage Club for business/first at 1:1",
            "Transfer to Hilton at 1:2 for aspirational properties",
            "Transfer to Delta for flash sales",
        ],
        "transfer_partners": {
            "airlines": ["Delta SkyMiles (1:1)", "Air France/KLM Flying Blue (1:1)", "British Airways Avios (1:1)", "JetBlue TrueBlue (1:1)", "Singapore KrisFlyer (1:1)", "Emirates Skywards (1:1)", "Air Canada Aeroplan (1:1)", "Virgin Atlantic Flying Club (1:1)", "ANA Mileage Club (1:1)"],
            "hotels": ["Hilton Honors (1:2)", "Marriott Bonvoy (1:1)"],
        },
        "cards": ["Platinum Card", "Gold Card", "Green Card", "Business Platinum"],
    },
    "Capital One Miles": {
        "type": "credit_card",
        "currency": "miles",
        "typical_cpp": 1.85,
        "sweet_spots": [
            "Transfer to Air Canada Aeroplan at 1:1",
            "Transfer to Turkish Miles&Smiles for Star Alliance at 1:1",
            "Transfer to Avianca LifeMiles at 1:1",
            "Book directly at 1¢/mile for simplicity",
        ],
        "transfer_partners": {
            "airlines": ["Air Canada Aeroplan (1:1)", "British Airways Avios (1:1)", "Air France/KLM Flying Blue (1:1)", "Singapore KrisFlyer (1:1)", "Emirates Skywards (1:1)", "Turkish Miles&Smiles (1:1)", "Avianca LifeMiles (1:1)", "Virgin Atlantic Flying Club (1:1)", "TAP Miles&Go (1:1)"],
            "hotels": ["Wyndham Rewards (1:1)", "Accor Live Limitless (2:1)"],
        },
        "cards": ["Venture X", "Venture", "Spark Miles"],
    },
    "Citi ThankYou Points": {
        "type": "credit_card",
        "currency": "points",
        "typical_cpp": 1.70,
        "sweet_spots": [
            "Transfer to Air France/KLM Flying Blue for promo awards",
            "Transfer to Turkish Miles&Smiles for Star Alliance",
            "Transfer to Avianca LifeMiles for partner awards",
        ],
        "transfer_partners": {
            "airlines": ["Air France/KLM Flying Blue (1:1)", "JetBlue TrueBlue (1:1)", "Singapore KrisFlyer (1:1)", "Turkish Miles&Smiles (1:1)", "Avianca LifeMiles (1:1)", "Virgin Atlantic Flying Club (1:1)", "American AAdvantage (1:1)", "Cathay Pacific Asia Miles (1:1)"],
            "hotels": ["Wyndham Rewards (1:1)"],
        },
        "cards": ["Strata Premier", "Double Cash (convert to ThankYou)", "Prestige"],
    },
    "Bilt Rewards": {
        "type": "credit_card",
        "currency": "points",
        "typical_cpp": 2.10,
        "sweet_spots": [
            "Transfer to Hyatt at 1:1 — most valuable hotel transfer",
            "Transfer to Alaska at 1:1 — great for Japan/Cathay awards",
            "Transfer to United/Aeroplan at 1:1",
            "Earn on rent with no transaction fee",
        ],
        "transfer_partners": {
            "airlines": ["United MileagePlus (1:1)", "Alaska Mileage Plan (1:1)", "American AAdvantage (1:1)", "Air Canada Aeroplan (1:1)", "British Airways Avios (1:1)", "Air France/KLM Flying Blue (1:1)", "Cathay Pacific Asia Miles (1:1)", "Emirates Skywards (1:1)", "Virgin Atlantic Flying Club (1:1)", "Turkish Miles&Smiles (1:1)", "ITA Volare (1:1)"],
            "hotels": ["World of Hyatt (1:1)", "Marriott Bonvoy (1:1)"],
        },
        "cards": ["Bilt Mastercard (no annual fee)"],
    },
}


def get_program(name: str) -> dict | None:
    """Exact or case-insensitive lookup."""
    if name in PROGRAMS:
        return PROGRAMS[name]
    name_lower = name.lower()
    for k, v in PROGRAMS.items():
        if k.lower() == name_lower or k.lower().startswith(name_lower):
            return v
    return None


def find_best_transfers_for_airline(airline_program: str) -> list[dict]:
    """Which credit card programs transfer INTO this airline program?"""
    results = []
    for prog_name, prog in PROGRAMS.items():
        if prog["type"] == "credit_card":
            for partner_str in prog["transfer_partners"].get("airlines", []):
                if airline_program.lower() in partner_str.lower():
                    results.append({"from": prog_name, "ratio": partner_str.split("(")[-1].rstrip(")")})
    return results


def evaluate_redemption_options(user_programs: dict, cash_price: float, route_type: str = "flight") -> list[dict]:
    """
    Given the user's balances, rank all programs by redemption value for this purchase.

    Args:
        user_programs: {program_name: balance}
        cash_price: the cash price in USD
        route_type: "flight" or "hotel"

    Returns:
        Sorted list of options with estimated savings and verdict.
    """
    results = []
    for prog_name, balance in user_programs.items():
        prog = get_program(prog_name)
        if not prog:
            continue

        cpp = prog.get("typical_cpp", 1.0)
        estimated_points_needed = int((cash_price / cpp) * 100)
        can_cover = balance >= estimated_points_needed
        savings = round(balance * cpp / 100, 2) if can_cover else round(balance * cpp / 100, 2)

        results.append({
            "program": prog_name,
            "type": prog["type"],
            "balance": balance,
            "typical_cpp": cpp,
            "estimated_points_needed": estimated_points_needed,
            "can_cover": can_cover,
            "estimated_value_usd": round(balance * cpp / 100, 2),
            "sweet_spots": prog.get("sweet_spots", []),
            "transfer_partners": prog.get("partners", prog.get("transfer_partners", {})),
            "verdict": "✅ Cover & save" if can_cover else f"⚠️ {balance:,} pts = ~${savings:.0f} value (partial)",
        })

    return sorted(results, key=lambda x: (-x["can_cover"], -x["estimated_value_usd"]))


ALL_PROGRAM_NAMES = list(PROGRAMS.keys())
