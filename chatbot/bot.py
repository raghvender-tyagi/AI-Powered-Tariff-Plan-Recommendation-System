"""
chatbot/agent.py
-----------------
Simple LangGraph agent for tariff plan recommendation.
Uses LangChain's model abstraction (no direct `anthropic` import) —
swap CHAT_MODEL env var to point at any provider LangChain supports
(e.g. "openai:gpt-4o-mini", "anthropic:claude-sonnet-4-6", "groq:...").

pip install langgraph langchain langchain-openai python-dotenv
"""

import os
from pathlib import Path
from typing import Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# -----------------------------------------------------------------
# 1. PLANS LIST — demo catalogue; replace these with your real plans later.
# -----------------------------------------------------------------
PLANS_LIST = """
1. Starter 199 - Rs 199 - 1GB/day data, 100 min calls, 100 SMS, roaming: no, validity: 28 days
2. Daily 299 - Rs 299 - 1.5GB/day data, unlimited calls, 100 SMS, roaming: no, validity: 28 days
3. Smart 399 - Rs 399 - 2.5GB/day data, unlimited calls, 100 SMS, roaming: no, validity: 28 days
4. Max 599 - Rs 599 - 3GB/day data, unlimited calls, 100 SMS, roaming: yes, validity: 56 days
5. Talktime 179 - Rs 179 - 500MB/day data, 2,000 min calls, 300 SMS, roaming: no, validity: 28 days
6. Traveler 799 - Rs 799 - 2GB/day data, unlimited calls, 100 SMS, roaming: yes, validity: 84 days
""".strip()

if "<PlanName>" in PLANS_LIST or PLANS_LIST == "PASTE YOUR PLANS HERE":
  raise RuntimeError("Replace PLANS_LIST in chatbot/bot.py with your real tariff plans before starting the chatbot.")

SYSTEM_PROMPT = f"""
You are a telecom tariff advisor chatbot. Your job is to have a short,
natural conversation with the customer to understand their usage needs,
then recommend the best-fit plans from the fixed catalogue below.

AVAILABLE PLANS (this is the complete catalogue — never invent a plan
that is not in this list, never mention any other operator's plan):
{PLANS_LIST}

RULES:
- Ask short, simple follow-up questions (one at a time) until you know
  enough about: data usage, calling usage, SMS usage, roaming/international
  need, and monthly budget.
- Do not ask more than 4 questions total. If the user has already given
  enough information in their first message, skip straight to a
  recommendation.
- When you have enough information, respond with exactly this structure:

  Recommended Plans:
  1. <Plan Name> (₹<price>) — <one-line reason this fits their need>
  2. <Plan Name> (₹<price>) — <one-line reason>
  3. <Plan Name> (₹<price>) — <one-line reason>

- Keep reasoning grounded only in the plan details given above and what
  the user told you — do not make up data/pricing.
- Keep tone friendly and concise. Reply in the same language style the
  user uses (Hindi/English/Hinglish).
""".strip()

# -----------------------------------------------------------------
# 2. MODEL — swap provider via env var, no anthropic SDK imported directly
# -----------------------------------------------------------------
openai_api_key = os.environ.get("OPENAI_API_KEY", "")
if not openai_api_key or openai_api_key == "replace-with-your-openai-api-key":
  raise RuntimeError(
    "OPENAI_API_KEY is not configured. Open .env and replace the placeholder with your real OpenAI API key."
  )

CHAT_MODEL = os.environ.get("CHAT_MODEL", "openai:gpt-4o-mini")
llm = init_chat_model(CHAT_MODEL, temperature=0.4)


# -----------------------------------------------------------------
# 3. GRAPH STATE
# -----------------------------------------------------------------
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


# -----------------------------------------------------------------
# 4. NODE — single node: call the model with system prompt + history
# -----------------------------------------------------------------
def advisor_node(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


# -----------------------------------------------------------------
# 5. BUILD GRAPH
# -----------------------------------------------------------------
graph_builder = StateGraph(AgentState)
graph_builder.add_node("advisor", advisor_node)
graph_builder.set_entry_point("advisor")
graph_builder.add_edge("advisor", END)

# MemorySaver keeps per-session conversation history keyed by thread_id,
# so you don't need to manually resend history on every call.
memory = MemorySaver()
agent_graph = graph_builder.compile(checkpointer=memory)


# -----------------------------------------------------------------
# 6. ENTRY POINT — call this from your backend route
# -----------------------------------------------------------------
def get_agent_reply(session_id: str, user_message: str) -> dict:
    config = {"configurable": {"thread_id": session_id}}
    result = agent_graph.invoke({"messages": [("user", user_message)]}, config=config)
    reply_text = result["messages"][-1].content
    is_recommendation = "Recommended Plans:" in reply_text
    return {"reply": reply_text, "is_recommendation": is_recommendation}


def run_terminal_chat() -> None:
  """Read customer messages from the terminal and print chatbot replies."""
  session_id = "terminal-session"
  print("Tariff Plan Chatbot")
  print("Type your message below. Type 'quit' or 'exit' to stop.\n")

  while True:
    try:
      user_message = input("You: ").strip()
    except (EOFError, KeyboardInterrupt):
      print("\nChat ended.")
      break

    if not user_message:
      print("Please enter a message.\n")
      continue
    if user_message.lower() in {"quit", "exit"}:
      print("Chat ended.")
      break

    try:
      result = get_agent_reply(session_id, user_message)
      print(f"\nBot: {result['reply']}\n")
    except Exception as error:
      print(f"\nError: {error}")
      print("Check that OPENAI_API_KEY is set in .env, then try again.\n")



if __name__ == "__main__":
  run_terminal_chat()