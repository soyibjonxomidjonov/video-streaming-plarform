from langchain_core.tools import tool

@tool
def pause_video():
    """Videoni to'xtatish"""
    return {}

@tool
def play_video():
    """Videoni davom ettirish"""
    return {}

@tool
def seek_forward(seconds: int =10):
    """Videoni oldinga o'tkazish"""
    return {"seconds": seconds}


@tool
def seek_backward(seconds: int =10):
    """Videoni orqaga o'tkazish"""
    return {"seconds": seconds}


@tool
def seek_to_time(seconds: int):
    """Aniq vaqtga o'tish ("5-daqiqaga o't")"""
    return {"seconds": seconds}

@tool
def set_volume(value: int):
    """Ovozni aniq darajaga qo'yish"""
    return {"value": value}

@tool
def increase_volume(step: float=0.1):
    """Ovozni ko'tarish (nisbiy)"""
    return {"step": step}

@tool
def decrease_volume(step: float=0.1):
    """Ovozni pasaytirish (nisbiy)"""
    return {"step": step}

@tool
def mute():
    """Ovozni o'chirish"""
    return {}

@tool
def unmute():
    """Ovozni yoqish"""
    return {}

@tool
def toggle_fullscreen():
    """To'liq ekran rejimi"""
    return {}


@tool
def set_playback_speed(speed: float):
    """Video tezligini o'zgartirish, masalan 1.5x"""
    return {"speed": speed}

@tool
def next_episode():
    """Keyingi qismga o'tish"""
    return {}


@tool
def previous_episode():
    """Oldingi qismga qaytish"""
    return {}


@tool
def restart_episode():
    """Qismni boshidan boshlash"""
    return {}




@tool
def scroll_down(amount: str = "normal"):
    """Sahifani pastga aylantirish. amount: 'small', 'normal', 'large'"""
    return {"amount": amount}

@tool
def scroll_up(amount: str = "normal"):
    """Sahifani yuqoriga aylantirish"""
    return {"amount": amount}

@tool
def scroll_to_bottom():
    """Sahifaning eng oxiriga tushish"""
    return {}

@tool
def scroll_to_top():
    """Sahifaning eng boshiga qaytish"""
    return {}

@tool
def go_back():
    """Oldingi sahifaga qaytish (brauzer tarixi orqali)"""
    return {}

@tool
def refresh_page():
    """Sahifani yangilash"""
    return {}

# ---------- Qidiruv va kashfiyot ----------

@tool
def search_content(query: str, content_type: str = "all"):
    """Kontentni nomi yoki mazmuni bo'yicha qidiradi (semantik qidiruv). content_type: 'movie', 'series', 'all'"""
    return {"query": query, "content_type": content_type}

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
    """Foydalanuvchiga kontent tavsiya qiladi, ixtiyoriy ravishda berilgan nom asosida"""
    return {"based_on": based_on}


# ---------- Kontent sahifasi ----------

@tool
def open_content(title: str):
    """Berilgan nomdagi film/serial sahifasini ochadi"""
    return {"title": title}

@tool
def show_content_details(title: str):
    """Kontent haqida batafsil ma'lumot (tavsif, janr, davomiylik) ko'rsatadi"""
    return {"title": title}

@tool
def list_episodes(series_title: str):
    """Serialning barcha qismlari ro'yxatini ko'rsatadi"""
    return {"series_title": series_title}


# ---------- Sevimlilar ----------

@tool
def add_to_favorites(title: str):
    """Kontentni sevimlilar ro'yxatiga qo'shadi"""
    return {"title": title}

@tool
def remove_from_favorites(title: str):
    """Kontentni sevimlilar ro'yxatidan olib tashlaydi"""
    return {"title": title}

@tool
def show_favorites():
    """Foydalanuvchining sevimlilar ro'yxatini ko'rsatadi"""
    return {}


# ---------- Tomosha progressi ----------

@tool
def resume_watching():
    """Foydalanuvchi oxirgi to'xtatgan joydan davom ettiradi"""
    return {}

@tool
def show_continue_watching():
    """"Davom ettirish" ro'yxatini (yarim ko'rilgan kontent) ko'rsatadi"""
    return {}

@tool
def show_watch_history():
    """Foydalanuvchi avval ko'rgan barcha kontent tarixini ko'rsatadi"""
    return {}

@tool
def mark_as_watched(title: str):
    """Kontentni "ko'rilgan" deb belgilaydi"""
    return {"title": title}


# ---------- Baholash va izoh ----------

@tool
def rate_content(title: str, stars: int):
    """Kontentga 1-5 oralig'ida yulduzcha bilan baho beradi"""
    return {"title": title, "stars": stars}

@tool
def add_comment(title: str, text: str):
    """Kontentga izoh qoldiradi"""
    return {"title": title, "text": text}

@tool
def show_comments(title: str):
    """Kontentga yozilgan izohlarni ko'rsatadi"""
    return {"title": title}


# ---------- Navigatsiya (qo'shimcha) ----------

@tool
def go_home():
    """Bosh sahifaga o'tadi"""
    return {}

@tool
def open_favorites_page():
    """Sevimlilar sahifasini ochadi"""
    return {}

@tool
def open_search_page():
    """Qidiruv sahifasini ochadi"""
    return {}

@tool
def open_profile_page():
    """Profil sahifasini ochadi"""
    return {}


# ---------- Hisob ----------

@tool
def check_login_status():
    """Foydalanuvchi tizimga kirganmi, tekshiradi"""
    return {}

@tool
def logout():
    """Tizimdan chiqadi"""
    return {}


# ---------- Sozlamalar / accessibility ----------

@tool
def toggle_subtitles(enabled: bool):
    """Subtitrlarni yoqadi/o'chiradi"""
    return {"enabled": enabled}

@tool
def set_subtitle_language(language: str):
    """Subtitr tilini o'zgartiradi"""
    return {"language": language}

@tool
def toggle_autoplay(enabled: bool):
    """Keyingi qismni avtomatik boshlashni yoqadi/o'chiradi"""
    return {"enabled": enabled}


# ---------- Meta ----------

@tool
def clarify_ambiguous_request(question: str):
    """Foydalanuvchi buyrug'i noaniq bo'lsa, aniqlashtiruvchi savol beradi"""
    return {"question": question}

@tool
def explain_capabilities():
    """Agent nima qila olishini tushuntiradi"""
    return {}
# @tool
# def click_element(target_description: str):
#     """Foydalanuvchi tasvirlagan elementni (tugma, havola) bosish.
#     target_description - foydalanuvchi qaysi elementni nazarda tutganini tasvirlaydi."""
#     return {"target_description": target_description}

TOOLS = [
    pause_video, play_video, seek_forward, seek_backward, seek_to_time,
    set_volume, increase_volume, decrease_volume, mute, unmute,
    toggle_fullscreen, set_playback_speed, next_episode, previous_episode,
    restart_episode, scroll_down, scroll_up, scroll_to_top, scroll_to_bottom, go_back, refresh_page, search_content,
    filter_by_genre, show_trending, show_new_releases, get_recommendations, open_content, show_content_details,
    list_episodes, add_to_favorites, remove_from_favorites, show_favorites, resume_watching,
    show_continue_watching, show_watch_history, mark_as_watched, rate_content, add_comment, show_comments,
    go_home, open_favorites_page, open_search_page, open_profile_page, check_login_status, logout,
    toggle_subtitles, set_subtitle_language,
    toggle_autoplay, clarify_ambiguous_request, explain_capabilities,
]






























