"""Modular LLM adapter — plug OpenAI / Gemini / Claude / local models."""

from __future__ import annotations

import os
from typing import Any


class LLMAdapter:
    provider: str = 'builtin'

    def generate(self, system: str, user: str, context: dict | None = None) -> str:
        raise NotImplementedError


class BuiltinAdapter(LLMAdapter):
    """Fallback — uses rule-based chat engine."""
    provider = 'builtin'

    def generate(self, system: str, user: str, context: dict | None = None) -> str:
        from engines.chat_engine import chat_response
        return chat_response(user, context or {}).get('reply', '')


class OpenAIAdapter(LLMAdapter):
    provider = 'openai'

    def generate(self, system: str, user: str, context: dict | None = None) -> str:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return BuiltinAdapter().generate(system, user, context)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            resp = client.chat.completions.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
                messages=[
                    {'role': 'system', 'content': system},
                    {'role': 'user', 'content': user},
                ],
                max_tokens=600,
            )
            return resp.choices[0].message.content or ''
        except Exception:
            return BuiltinAdapter().generate(system, user, context)


def get_llm_adapter() -> LLMAdapter:
    provider = (os.getenv('LLM_PROVIDER') or 'builtin').lower()
    if provider == 'openai' and os.getenv('OPENAI_API_KEY'):
        return OpenAIAdapter()
    return BuiltinAdapter()
