"""
Core autonomous travel agent — ReAct loop.

Reason → Act → Observe → Repeat until Claude returns end_turn.
Each TravelAgent instance is bound to one user profile.
"""

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

import anthropic
from dotenv import load_dotenv

import tools as tool_module
from memory import TravelMemory
from tools import TOOL_SCHEMAS, execute_tool

load_dotenv(Path(__file__).parent.parent / ".env")

MAX_ITERATIONS = 15
MODEL = "claude-sonnet-4-6"


@dataclass
class AgentResponse:
    text: str
    tool_calls_log: list[dict] = field(default_factory=list)
    reflection: dict | None = None
    itinerary: dict | None = None
    booking_links: dict | None = None
    iterations: int = 0


class TravelAgent:
    def __init__(self, profile_id: str | None = None):
        self.memory = (
            TravelMemory.load_profile(profile_id)
            if profile_id
            else TravelMemory()
        )
        if not self.memory:
            self.memory = TravelMemory.create_profile()
        tool_module.set_memory(self.memory)
        self.client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def chat(self, user_message: str, conversation_history: list[dict]) -> AgentResponse:
        """Run one turn of the travel agent (up to MAX_ITERATIONS tool loops)."""
        # Reload memory in case it was updated outside this instance
        self.memory.profile = self.memory._load()
        tool_module.set_memory(self.memory)

        messages = conversation_history + [{"role": "user", "content": user_message}]
        system_prompt = self.memory.get_system_prompt()

        tool_calls_log: list[dict] = []
        reflection: dict | None = None
        itinerary: dict | None = None
        booking_links: dict | None = None
        iterations = 0

        while iterations < MAX_ITERATIONS:
            iterations += 1

            response = self.client.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=system_prompt,
                tools=TOOL_SCHEMAS,
                messages=messages,
            )

            if response.stop_reason == "end_turn":
                return AgentResponse(
                    text=self._extract_text(response.content),
                    tool_calls_log=tool_calls_log,
                    reflection=reflection,
                    itinerary=itinerary,
                    booking_links=booking_links,
                    iterations=iterations,
                )

            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
            if not tool_use_blocks:
                return AgentResponse(
                    text=self._extract_text(response.content),
                    tool_calls_log=tool_calls_log,
                    reflection=reflection,
                    itinerary=itinerary,
                    booking_links=booking_links,
                    iterations=iterations,
                )

            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in tool_use_blocks:
                result = execute_tool(block.name, block.input)

                if block.name == "reflect_on_options":
                    reflection = result
                elif block.name == "build_itinerary" and "id" in result:
                    itinerary = result
                elif block.name == "generate_booking_links" and "booking_links" in result:
                    booking_links = result["booking_links"]

                tool_calls_log.append({
                    "tool":   block.name,
                    "input":  block.input,
                    "output": result,
                })

                tool_results.append({
                    "type":        "tool_result",
                    "tool_use_id": block.id,
                    "content":     json.dumps(result),
                })

            messages.append({"role": "user", "content": tool_results})

        return AgentResponse(
            text="I reached my processing limit. Please try a more specific request.",
            tool_calls_log=tool_calls_log,
            reflection=reflection,
            itinerary=itinerary,
            booking_links=booking_links,
            iterations=iterations,
        )

    @staticmethod
    def _extract_text(content: list) -> str:
        return " ".join(b.text for b in content if hasattr(b, "text")).strip()
