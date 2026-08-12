import itertools
import os
import json
import re


from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from openai import RateLimitError


from apps.llm.agents.prompts import SYSTEM_PROMPT
from apps.llm.agents.content_agents_v2 import TOOLS


load_dotenv()


api_keys = [
    os.environ.get("GROQ_API_KEY"),
    os.environ.get("GROQ_API_KEY_2"),
    os.environ.get("GROQ_API_KEY_3"),
    os.environ.get("GROQ_API_KEY_4"),
    os.environ.get("GROQ_API_KEY_5"),
    os.environ.get("GROQ_API_KEY_6"),
]


api_keys = [k for k in api_keys if k]


groq_api = itertools.cycle(api_keys)





FAILED_GENERATION_PATTERN = re.compile(
    r"<function=(\w+)>?(\{.*?\})(?:</function>)?"
)










def _parse_failed_generation(error_str: str) -> dict | None:

    match = FAILED_GENERATION_PATTERN.search(error_str)

    if not match:
        return None
    
    name = match.group(1)
    row_args = match.group(2)

    try:
        args = json.loads(row_args)
    except json.JSONDecodeError:
        return None
    
    return {"name": name, "args": args}


def route_command(text: str, max_retries=2) -> dict:

 

    last_error: Exception | None = None

    for attempt in range(max_retries + 1):
      
        # llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=next(groq_api))

        llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, api_key=next(groq_api))
        llm_with_tools = llm.bind_tools(TOOLS)

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
                    "payload": {"action": call["name"], "params": call["args"]},
                }
            
            return {"type": "escalate", "payload": {"original_text": text}}

        except RateLimitError as e:
            print(f"Key limiti tugadi: {repr(e)}")
            continue  

        except Exception as e:
            last_error = e
            error_str = str(e)
            print(f"⚠️ LLM xatosi (urinish {attempt + 1}/{max_retries + 1}): {repr(e)}")

            if "tool_use_failed" in error_str:
                parsed = _parse_failed_generation(error_str)
                if parsed:
                    print(f"✅ Fallback parser orqali tiklandi: {parsed}")
                    return {
                        "type": "action",
                        "payload": {"action": parsed["name"], "params": parsed["args"]},
                    }
                

                if attempt < max_retries:
                    text = (
                        f"{text}\n\n"
                        "(Iltimos, tool chaqiruvini standart formatda amalga oshir, "
                        "funksiya nomi va argumentlarni matn ichiga yozma.)"
                    )
                    continue
                else:
                    break

                
    print(f"❌ Barcha urinishlar muvaffaqiyatsiz. Oxirgi xato: {repr(last_error)}")
    return {
            "type": "error",
            "payload": {"code": "AGENT_ERROR", "message": "Sorry, no response!"},
                    }






















