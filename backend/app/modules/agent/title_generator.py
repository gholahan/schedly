import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

TITLE_GENERATION_PROMPT = """You are a title generator for calendar and scheduling conversations.

Given the user's first message, generate a short, natural conversation title.

RULES:
- Maximum 6 words
- Capture the main intent (e.g., "Schedule team meeting", "Check availability Friday")
- Use sentence case, not title case
- No punctuation at the end
- Be specific when possible (use day names, event types)
- If the message is a greeting only, return "New conversation"

Respond with ONLY the title, nothing else."""


async def generate_conversation_title(user_message: str, model: Any) -> str:
    """Generate a short conversation title from the user's first message.

    Args:
        user_message: The user's first message in the conversation
        model: The LangChain chat model instance (from gragh.model)

    Returns:
        A short, natural title string (max 6 words)
    """
    if not model:
        logger.warning("No LLM model available for title generation, using fallback")
        return _fallback_title(user_message)

    if not user_message or not user_message.strip():
        return "New conversation"

    try:
        logger.info("Generating conversation title from user message: %r", user_message[:50])

        response = await model.ainvoke(
            [
                SystemMessage(content=TITLE_GENERATION_PROMPT),
                HumanMessage(content=user_message),
            ]
        )

        title = str(response.content).strip()

        # Validate and clean the title
        if not title or len(title) > 100:
            logger.warning("Generated title invalid (empty or too long), using fallback")
            return _fallback_title(user_message)

        logger.info("Generated conversation title: %r", title)
        return title

    except Exception as exc:
        logger.error("Failed to generate conversation title: %s", exc, exc_info=True)
        return _fallback_title(user_message)


def _fallback_title(user_message: str) -> str:
    """Generate a simple fallback title when LLM is unavailable.

    Extracts first few words from the user message as the title.
    """
    if not user_message or not user_message.strip():
        return "New conversation"

    # Take first 6 words, capitalize first letter
    words = user_message.strip().split()[:6]
    title = " ".join(words)

    # Truncate if too long
    if len(title) > 20:
        title = title[:10] + "..."

    return title.capitalize()
