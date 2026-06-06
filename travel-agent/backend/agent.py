"""
Core autonomous travel agent.

Implements the ReAct loop (Reason → Act → Observe → Repeat) using
Claude's tool use API. Every response goes through:
  1. Plan   — Claude decides which tools to call
  2. Act    — tools execute and return results
  3. Observe— results added to the conversation
  4. Repeat — until Claude is ready to answer (stop_reason == "end_turn")

The reflect_on_options tool forces an explicit self-critique step
before any recommendation is presented to the user.
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
    def __init__(self):
        self.memory = TravelMemory()
        tool_module.set_memory(self.memory)
        self.client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def chat(self, user_message: str, conversation_history: list[dict]) -> AgentResponse:
        """
        Run one turn of the travel agent.

        Args:
            user_message: The user's latest message.
            conversation_history: All prior turns as Claude message dicts.

        Returns:
            AgentResponse with the agent's text reply and structured data.
        """
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

            # No more tool calls — agent is done
            if response.stop_reason == "end_turn":
                text = self._extract_text(response.content)
                return AgentResponse(
                    text=text,
                    tool_calls_log=tool_calls_log,
                    reflection=reflection,
                    itinerary=itinerary,
                    booking_links=booking_links,
                    iterations=iterations,
                )

            # Process tool calls
            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
            if not tool_use_blocks:
                text = self._extract_text(response.content)
                return AgentResponse(text=text, tool_calls_log=tool_calls_log,
                                     reflection=reflection, itinerary=itinerary,
                                     booking_links=booking_links, iterations=iterations)

            # Append assistant turn (with tool_use blocks)
            messages.append({"role": "assistant", "content": response.content})

            # Execute each tool and collect results
            tool_results = []
            for block in tool_use_blocks:
                result = execute_tool(block.name, block.input)

                # Capture structured data from specific tools
                if block.name == "reflect_on_options":
                    reflection = result
                elif block.name == "build_itinerary" and "id" in result:
                    itinerary = result
                elif block.name == "generate_booking_links" and "booking_links" in result:
                    booking_links = result["booking_links"]

                log_entry = {
                    "tool": block.name,
                    "input": block.input,
                    "output": result,
                }
                tool_calls_log.append(log_entry)

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })

            # Append tool results as next user turn
            messages.append({"role": "user", "content": tool_results})

        return AgentResponse(
            text="I ran into a processing limit. Please try a more specific request.",
            tool_calls_log=tool_calls_log,
            reflection=reflection,
            itinerary=itinerary,
            booking_links=booking_links,
            iterations=iterations,
        )

    @staticmethod
    def _extract_text(content: list) -> str:
        return " ".join(
            block.text for block in content if hasattr(block, "text")
        ).strip()
