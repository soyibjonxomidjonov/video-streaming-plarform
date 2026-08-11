import itertools
import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from apps.llm.agents.prompts import  SYSTEM_PROMPT
# from apps.llm.agents.content_agents import TOOLS
from apps.llm.agents.content_agents_v2 import TOOLS

load_dotenv()

api_keys= [
    os.environ.get("GROQ_API_KEY"),
    os.environ.get("GROQ_API_KEY_2"),
    os.environ.get("GROQ_API_KEY_3"),
    os.environ.get("GROQ_API_KEY_4"),
    os.environ.get("GROQ_API_KEY_5"),
    os.environ.get("GROQ_API_KEY_6"),
]

groq_api = itertools.cycle(api_keys)




llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=next(groq_api))
llm_with_tools = llm.bind_tools(TOOLS)


def route_command(text: str, max_retries=2) -> dict:
    for attempt in range(max_retries + 1):
        try:
            response = llm_with_tools.invoke(
                [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=text)
                ]
            )

            if response.tool_calls:
                call = response.tool_calls[0]

                return {
                    "type": "action",
                    "payload": {"action": call["name"], "params": call["args"]}
                }

            return {"type": "escalate", "payload": {"original_text": text}}

        except Exception as e:
            if "tool_use_failed" in str(e) and attempt < max_retries:
                continue
            raise

    return {"message": "Sorry not response!"}