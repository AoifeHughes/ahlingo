# -*- coding: utf-8 -*-
"""
Thin OpenAI-compatible client for structured generation via native tool-calling.

Every local, OpenAI-compatible inference server used by this project (Ollama,
llama.cpp server, vLLM, LM Studio, ...) speaks the same `tools` / `tool_choice`
protocol as the hosted OpenAI API. Forcing a single tool call whose parameters
are a Pydantic model's JSON schema gives us guaranteed-parseable, schema-shaped
output directly from the API -- no prompt-embedded schema text, no regex JSON
extraction, no stripping of <think> blocks.

This module is the single place that talks to the LLM. Everything else just
hands it a Pydantic model and a prompt.
"""

import json
import logging
import os
from typing import Optional, Type, TypeVar

import openai
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)

_TOOL_NAME = "submit_result"


def _strip_think(text: str) -> str:
    """Defensive cleanup for models that ignore tool_choice and answer in content."""
    import re

    if not text:
        return text
    return re.sub(
        r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE
    ).strip()


class LLMClient:
    """Wraps an OpenAI-compatible chat endpoint with schema-forced tool-calling."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str = "auto",
        debug: bool = False,
        no_think: bool = False,
    ):
        self.client = openai.OpenAI(base_url=base_url, api_key=api_key)
        self._requested_model = model
        self._resolved_model: Optional[str] = None
        self.debug = debug
        self.no_think = no_think

    @property
    def model(self) -> str:
        """Resolved model name, cached after the first lookup."""
        if self._resolved_model is None:
            self._resolved_model = self._resolve_model()
        return self._resolved_model

    def _resolve_model(self) -> str:
        if self._requested_model and self._requested_model != "auto":
            return self._requested_model

        try:
            models = self.client.models.list()
            if models.data:
                return models.data[0].id
        except Exception as exc:
            logging.warning(
                "Could not list models from %s: %s", self.client.base_url, exc
            )

        fallback = os.environ.get("AHLINGO_FALLBACK_MODEL", "qwen3-4b")
        logging.warning("No model resolved; falling back to %r", fallback)
        return fallback

    def generate(
        self,
        schema: Type[T],
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_retries: int = 2,
    ) -> Optional[T]:
        """Generate structured output matching `schema` via forced tool-calling.

        On a schema/JSON validation failure, the error is fed back to the model
        as a correction request (a self-repair loop) instead of silently
        returning malformed data.

        Returns a validated instance of `schema`, or None if the model could
        not produce valid output within `max_retries` repair attempts.
        """
        tool = {
            "type": "function",
            "function": {
                "name": _TOOL_NAME,
                "description": f"Submit the generated {schema.__name__} data.",
                "parameters": schema.model_json_schema(),
            },
        }

        if self.no_think:
            system_prompt = "/no_think\n" + system_prompt

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        last_error: object = "no attempts made"

        for attempt in range(max_retries + 1):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=[tool],
                    tool_choice={
                        "type": "function",
                        "function": {"name": _TOOL_NAME},
                    },
                    temperature=temperature,
                )
            except Exception as exc:
                last_error = exc
                logging.warning(
                    "LLM request failed (attempt %d/%d): %s",
                    attempt + 1,
                    max_retries + 1,
                    exc,
                )
                continue

            message = response.choices[0].message
            tool_calls = getattr(message, "tool_calls", None)

            if tool_calls:
                raw_args = tool_calls[0].function.arguments
            else:
                # Backend ignored tool_choice; salvage plain-text content.
                raw_args = _strip_think(message.content or "")

            if not raw_args:
                last_error = "model returned no tool call and no content"
            else:
                try:
                    data = json.loads(raw_args)
                    return schema.model_validate(data)
                except (json.JSONDecodeError, ValidationError) as exc:
                    last_error = exc
                    if self.debug:
                        logging.error(
                            "Validation failed for %s (attempt %d): %s\nRaw: %r",
                            schema.__name__,
                            attempt + 1,
                            exc,
                            raw_args,
                        )

            if attempt < max_retries:
                messages.append({"role": "assistant", "content": str(raw_args or "")})
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            f"That did not satisfy the required schema "
                            f"({last_error}). Call {_TOOL_NAME} again with "
                            f"corrected arguments."
                        ),
                    }
                )

        logging.warning(
            "Failed to generate valid %s after %d attempt(s): %s",
            schema.__name__,
            max_retries + 1,
            last_error,
        )
        return None
