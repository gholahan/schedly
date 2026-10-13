import logging
import os
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Any

from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg_pool import AsyncConnectionPool
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.core.config import settings
from app.modules.agent.prompt import SCHEDLY_SYSTEM_PROMPT
from app.modules.agent.state import ChatState
from app.modules.agent.tools import calendar_tools as tools

logger = logging.getLogger(__name__)

model: Any = None
graph: Any = None
_pg_pool: Any = None
operouter_api_key = getattr(settings, "openrouter_api_key", None) or os.getenv("OPENROUTER_API_KEY")

if operouter_api_key:
    try:
        model = init_chat_model(
            model=settings.openrouter_model,
            model_provider="openai",
            api_key=operouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
    except Exception as exc:
        logger.warning("Could not initialize chat model: %s", exc)
        model = None

if model is not None:
    model_with_tools = model.bind_tools(tools)
else:
    model_with_tools = None


async def _build_checkpointer():
    langgraph_url = getattr(settings, "langgraph_db_url", None) or os.getenv("LANGGRAPH_DB_URL")
    if langgraph_url and AsyncPostgresSaver is not None and AsyncConnectionPool is not None:
        try:
            logger.info("Initializing LangGraph AsyncPostgresSaver checkpointer...")
            _pg_pool = AsyncConnectionPool(
                langgraph_url,
                kwargs={
                    "prepare_threshold": None,
                    "autocommit": True,
                },
                open=False,
                reconnect_timeout=5,
                check=AsyncConnectionPool.check_connection,
            )
            await _pg_pool.open()
            checkpointer = AsyncPostgresSaver(_pg_pool)
            await checkpointer.setup()
            logger.info("Postgres checkpointer successfully connected and initialized.")
            return checkpointer, _pg_pool
        except Exception as exc:
            logger.warning(
                "Falling back to in-memory LangGraph checkpointer because Postgres initialization failed: %s",
                exc,
            )
    logger.info("LangGraph using in-memory MemorySaver checkpointer.")
    return MemorySaver(), None


# CHAT NODE

async def _call_model(
    state: ChatState,
) -> ChatState:
    if model_with_tools is None:
        raise RuntimeError(
            "Chat model is not configured. Ensure OPENROUTER_API_KEY is set."
        )

    messages = state["messages"]
    user_tz = state.get("user_timezone") or "UTC"
    logger.info(
        "Chat node invoking LLM: %d message(s) in context | User timezone: %s",
        len(messages),
        user_tz,
    )

    from app.modules.google_calendar.service import _get_zoneinfo
    tz = _get_zoneinfo(user_tz)
    now_local = datetime.now(tz)
    system_content = (
        f"{SCHEDLY_SYSTEM_PROMPT}\n\n"
        f"CURRENT DATE AND TIME: {now_local.strftime('%Y-%m-%d %H:%M:%S (%A)')}\n"
        f"USER TIMEZONE: {user_tz}"
    )

    response = await model_with_tools.ainvoke(
        [
            SystemMessage(content=system_content),
            *messages,
        ]
    )

    tool_calls = getattr(response, "tool_calls", None)
    if tool_calls:
        tool_names = [tc.get("name") for tc in tool_calls if isinstance(tc, dict)]
        logger.info(
            "LLM generated %d tool call(s): %s",
            len(tool_calls),
            tool_names,
        )
    else:
        content_preview = (
            str(response.content)[:80] + "..."
            if len(str(response.content)) > 80
            else str(response.content)
        )
        logger.info(
            "LLM returned direct assistant response: %r",
            content_preview,
        )

    return {
        "messages": [response],
    }


# GRAPH BUILDER

builder = StateGraph(ChatState)
builder.add_node("chat", _call_model)
builder.add_node("tools", ToolNode(tools))
builder.set_entry_point("chat")
builder.add_conditional_edges("chat", tools_condition)
builder.add_edge("tools", "chat")
builder.set_finish_point("chat")


@asynccontextmanager
async def setup_graph():
    global graph, _pg_pool

    if graph is not None:
        logger.info(
            "LangGraph already initialized; saver=%s",
            getattr(graph, "saver_type", "unknown"),
        )
        yield
        return

    try:
        checkpointer, _pg_pool = await _build_checkpointer()
        graph = builder.compile(checkpointer=checkpointer)
        graph.saver_type = type(checkpointer).__name__

        logger.info(
            "LangGraph compiled successfully with %s checkpointer.",
            graph.saver_type,
        )
        yield
    except Exception:
        logger.exception("Failed to initialize LangGraph graph.")
        raise
    finally:
        if _pg_pool is not None:
            await _pg_pool.close()
