from langgraph.graph import MessagesState


class ChatState(MessagesState):
    user_timezone: str | None