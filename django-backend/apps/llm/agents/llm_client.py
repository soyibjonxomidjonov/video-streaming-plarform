import json
import os
import re
import threading
import time

from dotenv import load_dotenv
from groq import APIConnectionError, APITimeoutError, InternalServerError, RateLimitError
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from apps.llm.agents.prompts import build_system_prompt
from apps.llm.agents.content_agents_v2 import ASSISTANT_TOOLS, TOOL_GROUPS, TOOL_NAMES


load_dotenv()

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
DEFAULT_COOLDOWN_SECONDS = 30.0

FAILED_GENERATION_PATTERN = re.compile(r"<function=(\w+)>?(\{.*?\})(?:</function>)?", re.DOTALL)


# Hamma tool'ni bir so'rovda yuborish Groq token limitiga sig'maydi va kichik modelni chalg'itadi,
# shuning uchun faqat kalit so'zlar mos kelgan guruhlar yuboriladi. Kalit so'zlar apostrofsiz yoziladi.
GROUP_KEYWORDS = {
    "player": (
        "video", "toxtat", "pauza", "davom", "ijro", "oldinga", "orqaga", "otkaz", "soniya",
        "sekund", "daqiqa", "minut", "ovoz", "jim", "tezlik", "tezroq", "sekin", "barobar",
        "baravar", "ekran", "subtitr", "titr", "qism", "seriya", "epizod", "boshidan",
        "kichik oyna", "boshlat", "qoy",
    ),
    "page": (
        "pastga", "tepaga", "yuqoriga", "tush", "chiq", "aylantir", "scroll", "sahifa", "bolim",
        "och", "qayt", "yangila", "bosh", "asosiy", "profil", "sozlama", "tarix", "mavzu",
        "qorongi", "yorug", "rejim", "avtomatik", "kattalashtir", "kichraytir", "zoom",
        "oqib ber", "oqi", "sevimlilar",
    ),
    "form": (
        "yoz", "kirit", "maydon", "bos", "tugma", "tanla", "belgi", "katak", "enter", "tozala",
        "ochir", "almashtir", "yop", "menyu", "forma", "yubor", "jonat", "harf", "soz",
        "email", "pochta", "parol", "login", "qidiruvga", "fokus", "klaviatura",
    ),
    "content": (
        "top", "qidir", "izla", "film", "kino", "serial", "dorama", "multfilm", "anime", "janr",
        "tavsiya", "mashhur", "trend", "yangi", "sevimli", "baho", "yulduz", "izoh", "komment",
        "ulash", "share", "muammo", "xato", "korilgan", "korgan", "tarix", "qism", "haqida",
        "och", "tizim", "akkaunt", "hisob", "saral", "qoy", "ber",
    ),
}
FALLBACK_GROUPS = ("page", "form", "content")

_APOSTROPHES = str.maketrans("", "", "'`ʻʼ‘’´")


def select_groups(text: str) -> tuple[str, ...]:
    normalized = text.lower().translate(_APOSTROPHES)
    groups = tuple(g for g, words in GROUP_KEYWORDS.items() if any(w in normalized for w in words))
    return groups or FALLBACK_GROUPS


class GroqKeyPool:
    """Kalitlarni navbat bilan beradi; limitga tushgan kalit cooldown tugaguncha o'tkazib yuboriladi."""

    def __init__(self, keys: list[str]):
        self._keys = keys
        self._cooldown_until = {k: 0.0 for k in keys}
        self._index = 0
        self._lock = threading.Lock()

    def __len__(self):
        return len(self._keys)

    def acquire(self) -> str | None:
        with self._lock:
            now = time.monotonic()
            for _ in range(len(self._keys)):
                key = self._keys[self._index]
                self._index = (self._index + 1) % len(self._keys)
                if self._cooldown_until[key] <= now:
                    return key
            return None

    def cool_down(self, key: str, seconds: float):
        with self._lock:
            self._cooldown_until[key] = time.monotonic() + seconds


def _load_keys() -> list[str]:
    names = ["GROQ_API_KEY"] + [f"GROQ_API_KEY_{i}" for i in range(2, 21)]
    keys = [os.environ.get(n, "").strip() for n in names]
    return list(dict.fromkeys(k for k in keys if k))


key_pool = GroqKeyPool(_load_keys())

_llm_cache: dict[tuple[str, tuple[str, ...]], object] = {}
_llm_cache_lock = threading.Lock()


def _get_llm(api_key: str, groups: tuple[str, ...]):
    cache_key = (api_key, groups)
    with _llm_cache_lock:
        llm = _llm_cache.get(cache_key)
        if llm is None:
            tools = [t for g in groups for t in TOOL_GROUPS[g]] + ASSISTANT_TOOLS
            # max_retries=0: limitga tushsa shu kalit bilan kutib turmasdan, darhol keyingi kalitga o'tamiz
            llm = ChatGroq(
                model=GROQ_MODEL,
                temperature=0,
                api_key=api_key,
                max_retries=0,
                timeout=20,
            ).bind_tools(tools)
            _llm_cache[cache_key] = llm
        return llm


def _retry_after_seconds(error: RateLimitError) -> float:
    try:
        value = error.response.headers.get("retry-after")
        return max(float(value), 1.0) if value else DEFAULT_COOLDOWN_SECONDS
    except (AttributeError, TypeError, ValueError):
        return DEFAULT_COOLDOWN_SECONDS


def _parse_failed_generation(error_str: str) -> dict | None:
    match = FAILED_GENERATION_PATTERN.search(error_str)
    if not match:
        return None

    name = match.group(1)
    if name not in TOOL_NAMES:
        return None

    try:
        args = json.loads(match.group(2))
    except json.JSONDecodeError:
        return None

    return {"name": name, "args": args if isinstance(args, dict) else {}}


def _action(name: str, args: dict) -> dict:
    return {"type": "action", "payload": {"action": name, "params": args or {}}}


def _error(message: str) -> dict:
    return {"type": "error", "payload": {"code": "AGENT_ERROR", "message": message}}


def route_command(text: str, max_retries=2) -> dict:
    if len(key_pool) == 0:
        print("❌ GROQ_API_KEY topilmadi")
        return _error("Yordamchi sozlanmagan")

    groups = select_groups(text)
    system_prompt = build_system_prompt(groups)
    prompt_text = text
    format_retries = 0
    last_error: Exception | None = None

    for _ in range(len(key_pool) + max_retries):
        api_key = key_pool.acquire()
        if api_key is None:
            print("⚠️ Barcha Groq kalitlari limitda")
            return _error("Hozir so'rovlar ko'p, birozdan keyin qayta urinib ko'ring")

        try:
            response = _get_llm(api_key, groups).invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt_text),
            ])

        except RateLimitError as e:
            key_pool.cool_down(api_key, _retry_after_seconds(e))
            print(f"Key limiti tugadi, keyingi kalitga o'tilmoqda: {repr(e)}")
            last_error = e
            continue

        except (APIConnectionError, APITimeoutError, InternalServerError) as e:
            print(f"⚠️ Groq tarmoq/server xatosi: {repr(e)}")
            last_error = e
            continue

        except Exception as e:
            last_error = e
            error_str = str(e)
            print(f"⚠️ LLM xatosi: {repr(e)}")

            if "tool_use_failed" in error_str:
                parsed = _parse_failed_generation(error_str)
                if parsed:
                    print(f"✅ Fallback parser orqali tiklandi: {parsed}")
                    return _action(parsed["name"], parsed["args"])

                if format_retries < max_retries:
                    format_retries += 1
                    prompt_text = (
                        f"{text}\n\n"
                        "(Tool chaqiruvini standart formatda amalga oshir, "
                        "funksiya nomi va argumentlarni matn ichiga yozma.)"
                    )
                    continue
            break

        if response.tool_calls:
            call = response.tool_calls[0]
            if call["name"] in TOOL_NAMES:
                return _action(call["name"], call.get("args") or {})
            print(f"⚠️ Noma'lum tool chaqirildi: {call['name']}")

        return {"type": "escalate", "payload": {"original_text": text}}

    print(f"❌ Barcha urinishlar muvaffaqiyatsiz. Oxirgi xato: {repr(last_error)}")
    return _error("Sorry, no response!")
