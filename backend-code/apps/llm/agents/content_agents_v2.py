"""
Video-streaming platforma uchun LLM agent tools.

IKKI TOIFA:
1. Frontend tools (playback, scroll, navigatsiya) — bazaga tegmaydi,
   faqat "signal" qaytaradi, haqiqiy amalni JS bajaradi.
2. Backend tools (search, favorites, rating, comment, watch progress) —
   Django ORM orqali, haqiqiy o'qish/yozish qiladi.

MUHIM — SO'ROV KONTEKSTI:
Ko'p backend tool "kim" (foydalanuvchi) va "hozir nima ko'rilyapti" (frontend holati)
bilishi kerak, lekin LLM bularni bilmaydi. Shuning uchun, Django view, agentni
chaqirishdan OLDIN, quyidagini bajarishi SHART:

    from content_agents_full import set_request_context

    set_request_context(
        user=request.user,
        frontend_state={
            "content_type": "movie",
            "content_id": 45,
            "content_title": "Men robot emasman",
            "episode_number": None,
            "is_playing": True,
            "current_time_seconds": 320,
        },
    )
    # ...shundan keyin, agent/LLM chaqiriladi
"""

import contextvars

from django.db.models import Avg, Count
from langchain_core.tools import tool



# =====================================================================
# SO'ROV KONTEKSTI
# =====================================================================

_current_user_ctx = contextvars.ContextVar("current_user", default=None)
_frontend_state_ctx = contextvars.ContextVar("frontend_state", default={})


def set_request_context(user, frontend_state: dict | None = None):
    """Django view'da, agentni chaqirishdan OLDIN, har bir so'rov uchun chaqiriladi."""
    _current_user_ctx.set(user)
    _frontend_state_ctx.set(frontend_state or {})


def _get_user():
    user = _current_user_ctx.get()
    if user is None:
        raise RuntimeError(
            "Foydalanuvchi konteksti o'rnatilmagan — "
            "set_request_context() view'da chaqirilishi shart"
        )
    return user


def _get_frontend_state() -> dict:
    return _frontend_state_ctx.get()


def _resolve_title_or_current(title: str | None):
    """title berilmasa ('bunga', 'shu filmga'), joriy ko'rilayotgan kontentni ishlatadi."""
    if title:
        return title
    return _get_frontend_state().get("content_title")


# ============================================
# BULAR — LLM'GA UMUMAN YUBORILMAYDI (@tool emas!)
# Frontendda, regex/kalit-so'z orqali, to'g'ridan-to'g'ri hal bo'ladi.
# Faqat hujjat/ma'lumot uchun ro'yxat, kod emas.
# ============================================
#
# VIDEO BOSHQARUVI:
#   pause_video, play_video, seek_forward(seconds), seek_backward(seconds),
#   seek_to_time(seconds), set_volume(value), increase_volume(step),
#   decrease_volume(step), mute, unmute, toggle_fullscreen,
#   set_playback_speed(speed), restart_episode, next_episode, previous_episode
#
# NAVIGATSIYA:
#   scroll_down(amount), scroll_up(amount), scroll_to_top, scroll_to_bottom,
#   go_back, refresh_page, go_home, open_favorites_page, open_search_page,
#   open_profile_page, stop_listening
#
# Bularning har biri, frontenddagi KEYWORD_PATTERNS + PLAYBACK_HANDLERS
# ichida, to'liq mustaqil ishlaydi. Backend/LLM bu haqda hech narsa bilmaydi.


# ============================================
# BULAR — HAQIQIY @tool (LLM sxemasiga yuboriladi)
# Chunki, ma'noni tushunish / backend API kerak bo'ladi
# (masalan "ikkinchi qismini och" yoki "bunga besh qo'y" kabi buyruqlar)
# ============================================

@tool
def search_content(query: str, content_type: str = "all"):
    """Kontentni nomi yoki mazmuni bo'yicha qidiradi"""
    return {"query": query, "content_type": content_type}

@tool
def select_search_result(index: int):
    """Qidiruv natijalaridan, tartib raqami bo'yicha birini tanlab ochadi"""
    return {"index": index}

@tool
def filter_by_genre(genre: str):
    """Berilgan janr bo'yicha kontentni filtrlaydi"""
    return {"genre": genre}

@tool
def show_trending():
    """Eng ko'p ko'rilgan/mashhur kontentni ko'rsatadi"""
    return {}

@tool
def show_new_releases():
    """Yangi qo'shilgan kontentni ko'rsatadi"""
    return {}

@tool
def get_recommendations(based_on: str = None):
    """Foydalanuvchiga kontent tavsiya qiladi"""
    return {"based_on": _resolve_title_or_current(based_on)}

@tool
def sort_content(criteria: str):
    """Kontent ro'yxatini saralaydi (newest/rating/alphabetical/popularity)"""
    return {"criteria": criteria}

@tool
def open_content(title: str):
    """Berilgan nomdagi film/serial sahifasini ochadi"""
    return {"title": title}

@tool
def show_content_details(title: str = None):
    """Kontent haqida batafsil ma'lumot ko'rsatadi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def list_episodes(series_title: str = None):
    """Serialning barcha qismlari ro'yxatini ko'rsatadi"""
    return {"series_title": _resolve_title_or_current(series_title)}

@tool
def add_to_favorites(title: str = None):
    """Kontentni sevimlilar ro'yxatiga qo'shadi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def remove_from_favorites(title: str = None):
    """Kontentni sevimlilar ro'yxatidan olib tashlaydi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def show_favorites():
    """Foydalanuvchining sevimlilar ro'yxatini ko'rsatadi"""
    return {}

@tool
def resume_watching():
    """Foydalanuvchi oxirgi to'xtatgan joydan davom ettiradi"""
    return {}

@tool
def show_continue_watching():
    """"Davom ettirish" ro'yxatini ko'rsatadi"""
    return {}

@tool
def show_watch_history():
    """Butun tomosha tarixini ko'rsatadi"""
    return {}

@tool
def mark_as_watched(title: str = None):
    """Kontentni "ko'rilgan" deb belgilaydi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def remove_from_continue_watching(title: str = None):
    """"Davom ettirish" ro'yxatidan olib tashlaydi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def clear_watch_history():
    """Butun tomosha tarixini tozalaydi"""
    return {}

@tool
def rate_content(stars: int, title: str = None):
    """Kontentga 1-5 oralig'ida baho beradi"""
    return {"stars": stars, "title": _resolve_title_or_current(title)}

@tool
def add_comment(text: str, title: str = None):
    """Kontentga izoh qoldiradi"""
    return {"text": text, "title": _resolve_title_or_current(title)}

@tool
def show_comments(title: str = None):
    """Kontentga yozilgan izohlarni ko'rsatadi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def delete_comment(comment_id: int):
    """O'zining izohini o'chiradi"""
    return {"comment_id": comment_id}

@tool
def share_content(title: str = None):
    """Kontentga ulashish linki yaratadi"""
    return {"title": _resolve_title_or_current(title)}

@tool
def report_problem(issue_type: str, description: str = "", title: str = None):
    """Kontent yoki texnik muammo haqida xabar beradi"""
    return {"issue_type": issue_type, "description": description, "title": _resolve_title_or_current(title)}

@tool
def check_login_status():
    """Foydalanuvchi tizimga kirganmi, tekshiradi"""
    return {}

@tool
def logout():
    """Tizimdan chiqadi"""
    return {}


TOOLS = [
    # Qidiruv va kashf qilish
    search_content,
    select_search_result,
    filter_by_genre,
    show_trending,
    show_new_releases,
    get_recommendations,
    sort_content,

    # Kontent sahifasi
    open_content,
    show_content_details,
    list_episodes,

    # Sevimlilar
    add_to_favorites,
    remove_from_favorites,
    show_favorites,

    # Tomosha progressi
    resume_watching,
    show_continue_watching,
    show_watch_history,
    mark_as_watched,
    remove_from_continue_watching,
    clear_watch_history,

    # Baholash va izohlar
    rate_content,
    add_comment,
    show_comments,
    delete_comment,

    # Ulashish va muammo haqida xabar
    share_content,
    report_problem,

    # Akkaunt
    check_login_status,
    logout,
]