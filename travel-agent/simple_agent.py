"""
Simple agent demo — ReAct loop with 2 tools.

This is the core agent pattern: Claude reasons, calls a tool, sees the result,
reasons again, and repeats until it has enough to answer.

Run: python simple_agent.py
Requires: pip install anthropic python-dotenv
"""

import json
import os
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ── ANSI colors (no extra libraries needed) ──────────────────────────────────
YELLOW = "\033[33m"
CYAN   = "\033[36m"
GREEN  = "\033[32m"
RESET  = "\033[0m"

# ── Mock tool implementations ─────────────────────────────────────────────────

def search_flights(origin: str, destination: str, date: str) -> dict:
    return {
        "flights": [
            {"airline": "Delta",   "flight": "DL402", "departs": "7:00 AM",  "arrives": "9:55 AM",  "price": 189, "stops": 0},
            {"airline": "JetBlue", "flight": "B6712", "departs": "11:30 AM", "arrives": "2:20 PM",  "price": 134, "stops": 0},
            {"airline": "Spirit",  "flight": "NK204", "departs": "6:15 AM",  "arrives": "9:05 AM",  "price": 89,  "stops": 0},
            {"airline": "United",  "flight": "UA881", "departs": "3:45 PM",  "arrives": "9:10 PM",  "price": 112, "stops": 1},
        ],
        "route": f"{origin} → {destination}",
        "date": date,
    }


def get_weather(city: str) -> dict:
    return {
        "city": city,
        "forecast": "Sunny, 84°F",
        "humidity": "72%",
        "wind": "12 mph SE",
        "summary": "Great beach weather — bring sunscreen.",
    }


TOOL_HANDLERS = {
    "search_flights": lambda inp: search_flights(**inp),
    "get_weather":    lambda inp: get_weather(**inp),
}

# ── Tool schemas (what Claude sees) ──────────────────────────────────────────

TOOLS = [
    {
        "name": "search_flights",
        "description": "Search for available flights between two cities on a given date.",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin":      {"type": "string", "description": "Departure airport city or code"},
                "destination": {"type": "string", "description": "Arrival airport city or code"},
                "date":        {"type": "string", "description": "Travel date (e.g. 'next Friday' or '2026-06-13')"},
            },
            "required": ["origin", "destination", "date"],
        },
    },
    {
        "name": "get_weather",
        "description": "Get the weather forecast for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"},
            },
            "required": ["city"],
        },
    },
]

# ── ReAct loop ────────────────────────────────────────────────────────────────

def main():
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    question = "Find me cheap flights from NYC to Miami next Friday and tell me what the weather will be like there."
    print(f"\nUser: {question}\n")

    messages = [{"role": "user", "content": question}]
    step = 0

    while step < 10:
        step += 1
        print(f"{YELLOW}[Step {step}] Claude is thinking...{RESET}")

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=TOOLS,
            messages=messages,
        )

        # Claude is done — print final answer
        if response.stop_reason == "end_turn":
            answer = " ".join(b.text for b in response.content if hasattr(b, "text"))
            print(f"\nAgent: {answer}\n")
            break

        # Claude wants to call tools
        messages.append({"role": "assistant", "content": response.content})
        tool_results = []

        for block in response.content:
            if block.type != "tool_use":
                continue

            print(f"{CYAN}  → tool call: {block.name}({json.dumps(block.input)}){RESET}")
            result = TOOL_HANDLERS[block.name](block.input)
            print(f"{GREEN}  ← result: {json.dumps(result, indent=2)}{RESET}")

            tool_results.append({
                "type":        "tool_result",
                "tool_use_id": block.id,
                "content":     json.dumps(result),
            })

        messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    main()
