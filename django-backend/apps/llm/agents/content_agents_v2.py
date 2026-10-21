"""
Ovozli yordamchi uchun LLM tool'lari.

Tool'lar hech narsani o'zi bajarmaydi — LLM faqat qaysi tool va qanday
parametr bilan chaqirilishini tanlaydi, route_command() esa buni
{"type": "action", "payload": {"action": <nom>, "params": <args>}} ko'rinishida
WebSocket orqali frontendga yuboradi. Haqiqiy amalni frontend bajaradi.
Ixtiyoriy matn parametrlari berilmasa "" (bo'sh satr) bo'ladi.
"""

import contextvars
from typing import Literal

from langchain_core.tools import tool


# =====================================================================
# SO'ROV KONTEKSTI
# =====================================================================

_current_user_ctx = contextvars.ContextVar("current_user", default=None)
_frontend_state_ctx = contextvars.ContextVar("frontend_state", default={})


def set_request_context(user, frontend_state: dict | None = None):
    _current_user_ctx.set(user)
    _frontend_state_ctx.set(frontend_state or {})


def _get_user():
    user = _current_user_ctx.get()
    if user is None:
        raise RuntimeError("Foydalanuvchi konteksti o'rnatilmagan")
    return user


def _get_frontend_state() -> dict:
    return _frontend_state_ctx.get()


def _resolve_title_or_current(title: str | None):
    if title:
        return title
    return _get_frontend_state().get("content_title")


ScrollAmount = Literal["small", "normal", "large"]
PageName = Literal[
    "home", "movies", "series", "genres", "explore", "search", "favorites",
    "history", "profile", "settings", "login", "register", "admin",
]
KeyName = Literal[
    "Enter", "Escape", "Tab", "Backspace", "Delete", "Space",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]


# =====================================================================
# 1. VIDEO PLEER
# =====================================================================

@tool
def pause_video():
    """Videoni pauza qiladi."""
    return {}

@tool
def play_video():
    """Videoni ijro etadi / davom ettiradi."""
    return {}

@tool
def seek_forward(seconds: int = 10):
    """Videoni N sekund oldinga o'tkazadi."""
    return {"seconds": seconds}

@tool
def seek_backward(seconds: int = 10):
    """Videoni N sekund orqaga qaytaradi."""
    return {"seconds": seconds}

@tool
def seek_to_time(seconds: int):
    """Videoning aniq vaqtiga o'tadi (boshidan sekund)."""
    return {"seconds": seconds}

@tool
def set_volume(value: int):
    """Ovozni aniq darajaga qo'yadi (0-100)."""
    return {"value": value}

@tool
def increase_volume(step: float = 0.1):
    """Ovozni balandlatadi (step 0-1)."""
    return {"step": step}

@tool
def decrease_volume(step: float = 0.1):
    """Ovozni pasaytiradi (step 0-1)."""
    return {"step": step}

@tool
def mute():
    """Ovozni o'chiradi."""
    return {}

@tool
def unmute():
    """Ovozni qayta yoqadi."""
    return {}

@tool
def toggle_fullscreen():
    """To'liq ekranni yoqadi/o'chiradi."""
    return {}

@tool
def toggle_picture_in_picture():
    """Videoni kichik suzuvchi oynaga chiqaradi/qaytaradi."""
    return {}

@tool
def set_playback_speed(speed: float):
    """Ijro tezligi (0.25-2.0, oddiy 1.0)."""
    return {"speed": speed}

@tool
def toggle_subtitles(enabled: bool):
    """Subtitrni yoqadi yoki o'chiradi."""
    return {"enabled": enabled}

@tool
def set_subtitle_language(language: str):
    """Subtitr tili: 'uz', 'ru', 'en' va h.k."""
    return {"language": language}

@tool
def next_episode():
    """Keyingi qism."""
    return {}

@tool
def previous_episode():
    """Oldingi qism."""
    return {}

@tool
def restart_episode():
    """Videoni boshidan boshlaydi."""
    return {}

@tool
def play_episode(episode_number: int, series_title: str = ""):
    """Serialning N-qismini ochadi. series_title bo'sh bo'lsa joriy serial."""
    return {"episode_number": episode_number, "series_title": _resolve_title_or_current(series_title)}


# =====================================================================
# 2. SAHIFA: NAVIGATSIYA, SKROLL, SOZLAMALAR
# =====================================================================

@tool
def go_home():
    """Bosh sahifa."""
    return {}

@tool
def go_back():
    """Oldingi sahifaga qaytish."""
    return {}

@tool
def go_forward():
    """Brauzer tarixida oldinga."""
    return {}

@tool
def refresh_page():
    """Sahifani yangilash."""
    return {}

@tool
def open_favorites_page():
    """Sevimlilar sahifasi."""
    return {}

@tool
def open_search_page():
    """Qidiruv sahifasi."""
    return {}

@tool
def open_profile_page():
    """Profil sahifasi."""
    return {}

@tool
def open_page(page: PageName):
    """Saytning boshqa bo'limini ochadi."""
    return {"page": page}

@tool
def next_page():
    """Ro'yxatning keyingi sahifasi."""
    return {}

@tool
def previous_page():
    """Ro'yxatning oldingi sahifasi."""
    return {}

@tool
def go_to_page(number: int):
    """Ro'yxatning N-sahifasi."""
    return {"number": number}

@tool
def scroll_down(amount: ScrollAmount = "normal"):
    """Pastga aylantirish."""
    return {"amount": amount}

@tool
def scroll_up(amount: ScrollAmount = "normal"):
    """Yuqoriga aylantirish."""
    return {"amount": amount}

@tool
def scroll_to_top():
    """Sahifa boshiga chiqish."""
    return {}

@tool
def scroll_to_bottom():
    """Sahifa oxiriga tushish."""
    return {}

@tool
def scroll_to_element(target: str):
    """Aytilgan bo'lim/elementgacha aylantirish."""
    return {"target": target}

@tool
def set_theme(theme: Literal["dark", "light", "system"]):
    """Sayt mavzusi: qorong'i, yorug' yoki tizimga mos."""
    return {"theme": theme}

@tool
def toggle_autoplay(enabled: bool):
    """Keyingi qismni avtomatik boshlashni yoqadi/o'chiradi."""
    return {"enabled": enabled}

@tool
def zoom_page(direction: Literal["in", "out", "reset"]):
    """Sahifani kattalashtirish/kichraytirish/asliga qaytarish."""
    return {"direction": direction}

@tool
def read_page_aloud(target: str = ""):
    """Sahifani yoki aytilgan qismni ovoz chiqarib o'qiydi."""
    return {"target": target}


# =====================================================================
# 3. SAHIFA ELEMENTLARI VA FORMALAR
# =====================================================================

@tool
def click_element(target: str):
    """Tugma, havola, karta yoki boshqa elementni bosadi."""
    return {"target": target}

@tool
def type_text(
    text: str,
    target: str = "",
    mode: Literal["replace", "append", "prepend"] = "replace",
    submit: bool = False,
):
    """Maydonga yakuniy matnni yozadi. target bo'sh — fokusdagi maydon. submit=true — yozib Enter bosadi."""
    return {"text": text, "target": target, "mode": mode, "submit": submit}

@tool
def replace_text_in_field(find: str, replace_with: str, target: str = ""):
    """Maydondagi matn qismini boshqasiga almashtiradi."""
    return {"find": find, "replace_with": replace_with, "target": target}

@tool
def delete_text(scope: Literal["all", "last_word", "last_character"] = "all", target: str = ""):
    """Maydondagi matnni o'chiradi."""
    return {"scope": scope, "target": target}

@tool
def press_key(key: KeyName):
    """Klaviatura tugmasini bosadi."""
    return {"key": key}

@tool
def focus_element(target: str):
    """Maydon/elementga fokus qo'yadi."""
    return {"target": target}

@tool
def select_option(option: str, target: str = ""):
    """Dropdown yoki tanlovdan variant tanlaydi."""
    return {"option": option, "target": target}

@tool
def set_checkbox(checked: bool, target: str):
    """Checkbox/switch ni yoqadi yoki o'chiradi."""
    return {"checked": checked, "target": target}

@tool
def submit_form(target: str = ""):
    """Formani yuboradi."""
    return {"target": target}

@tool
def close_popup():
    """Modal oyna, menyu yoki bildirishnomani yopadi."""
    return {}

@tool
def toggle_sidebar():
    """Yon menyuni ochadi/yopadi."""
    return {}


# =====================================================================
# 4. KONTENT (backend ma'lumotlari bilan ishlaydigan amallar)
# =====================================================================

@tool
def search_content(query: str, content_type: Literal["all", "movie", "series"] = "all"):
    """Film/serialni nomi yoki mazmuni bo'yicha qidiradi."""
    return {"query": query, "content_type": content_type}

@tool
def select_search_result(index: int):
    """Qidiruv natijalaridan N-sini ochadi (1 dan)."""
    return {"index": index}

@tool
def filter_by_genre(genre: str):
    """Janr bo'yicha filtrlaydi."""
    return {"genre": genre}

@tool
def show_trending():
    """Eng mashhur kontent."""
    return {}

@tool
def show_new_releases():
    """Yangi qo'shilgan kontent."""
    return {}

@tool
def get_recommendations(based_on: str = ""):
    """Kontent tavsiya qiladi."""
    return {"based_on": _resolve_title_or_current(based_on)}

@tool
def sort_content(criteria: Literal["newest", "rating", "alphabetical", "popularity"]):
    """Ro'yxatni saralaydi."""
    return {"criteria": criteria}

@tool
def open_content(title: str):
    """Nomi aytilgan film/serial sahifasini ochadi."""
    return {"title": title}

@tool
def show_content_details(title: str = ""):
    """Kontent haqida batafsil ma'lumot."""
    return {"title": _resolve_title_or_current(title)}

@tool
def list_episodes(series_title: str = ""):
    """Serial qismlari ro'yxati."""
    return {"series_title": _resolve_title_or_current(series_title)}

@tool
def add_to_favorites(title: str = ""):
    """Sevimlilarga qo'shadi."""
    return {"title": _resolve_title_or_current(title)}

@tool
def remove_from_favorites(title: str = ""):
    """Sevimlilardan olib tashlaydi."""
    return {"title": _resolve_title_or_current(title)}

@tool
def show_favorites():
    """Sevimlilar ro'yxati."""
    return {}

@tool
def resume_watching():
    """Oxirgi to'xtagan joydan davom ettiradi."""
    return {}

@tool
def show_continue_watching():
    """Yarim ko'rilganlar ro'yxati."""
    return {}

@tool
def show_watch_history():
    """Tomosha tarixi."""
    return {}

@tool
def mark_as_watched(title: str = ""):
    """Ko'rilgan deb belgilaydi."""
    return {"title": _resolve_title_or_current(title)}

@tool
def remove_from_continue_watching(title: str = ""):
    """Davom ettirish ro'yxatidan olib tashlaydi."""
    return {"title": _resolve_title_or_current(title)}

@tool
def clear_watch_history():
    """Tomosha tarixini tozalaydi."""
    return {}

@tool
def rate_content(stars: int, title: str = ""):
    """1-5 yulduz baho beradi."""
    return {"stars": stars, "title": _resolve_title_or_current(title)}

@tool
def add_comment(text: str, title: str = ""):
    """Kontentga izoh qoldiradi va yuboradi."""
    return {"text": text, "title": _resolve_title_or_current(title)}

@tool
def show_comments(title: str = ""):
    """Izohlarni ko'rsatadi."""
    return {"title": _resolve_title_or_current(title)}

@tool
def delete_comment(comment_id: int):
    """O'z izohini o'chiradi."""
    return {"comment_id": comment_id}

@tool
def share_content(title: str = ""):
    """Ulashish havolasini yaratadi."""
    return {"title": _resolve_title_or_current(title)}

@tool
def report_problem(issue_type: str, description: str = "", title: str = ""):
    """Kontent yoki texnik muammo haqida xabar beradi."""
    return {"issue_type": issue_type, "description": description, "title": _resolve_title_or_current(title)}

@tool
def check_login_status():
    """Tizimga kirganini tekshiradi."""
    return {}

@tool
def logout():
    """Tizimdan chiqadi."""
    return {}


# =====================================================================
# 5. YORDAMCHI (har doim yuboriladi)
# =====================================================================

@tool
def stop_listening():
    """Ovozli yordamchi tinglashni to'xtatadi."""
    return {}

@tool
def clarify_ambiguous_request(question: str):
    """Buyruq noaniq bo'lsa aniqlashtiruvchi savol beradi."""
    return {"question": question}

@tool
def explain_capabilities():
    """Yordamchi nimalar qila olishini tushuntiradi."""
    return {}


TOOL_GROUPS = {
    "player": [
        pause_video, play_video, seek_forward, seek_backward, seek_to_time,
        set_volume, increase_volume, decrease_volume, mute, unmute,
        toggle_fullscreen, toggle_picture_in_picture, set_playback_speed,
        toggle_subtitles, set_subtitle_language,
        next_episode, previous_episode, restart_episode, play_episode,
    ],
    "page": [
        go_home, go_back, go_forward, refresh_page,
        open_favorites_page, open_search_page, open_profile_page, open_page,
        next_page, previous_page, go_to_page,
        scroll_down, scroll_up, scroll_to_top, scroll_to_bottom, scroll_to_element,
        set_theme, toggle_autoplay, zoom_page, read_page_aloud,
    ],
    "form": [
        click_element, type_text, replace_text_in_field, delete_text, press_key,
        focus_element, select_option, set_checkbox, submit_form, close_popup, toggle_sidebar,
    ],
    "content": [
        search_content, select_search_result, filter_by_genre, show_trending,
        show_new_releases, get_recommendations, sort_content,
        open_content, show_content_details, list_episodes,
        add_to_favorites, remove_from_favorites, show_favorites,
        resume_watching, show_continue_watching, show_watch_history,
        mark_as_watched, remove_from_continue_watching, clear_watch_history,
        rate_content, add_comment, show_comments, delete_comment,
        share_content, report_problem, check_login_status, logout,
    ],
}

ASSISTANT_TOOLS = [stop_listening, clarify_ambiguous_request, explain_capabilities]

TOOLS = [t for group in TOOL_GROUPS.values() for t in group] + ASSISTANT_TOOLS

TOOL_NAMES = {t.name for t in TOOLS}
