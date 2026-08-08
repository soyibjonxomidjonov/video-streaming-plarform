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

# @tool
# def click_element(target_description: str):
#     """Foydalanuvchi tasvirlagan elementni (tugma, havola) bosish.
#     target_description - foydalanuvchi qaysi elementni nazarda tutganini tasvirlaydi."""
#     return {"target_description": target_description}

TOOLS = [
    pause_video, play_video, seek_forward, seek_backward, seek_to_time,
    set_volume, increase_volume, decrease_volume, mute, unmute,
    toggle_fullscreen, set_playback_speed, next_episode, previous_episode,
    restart_episode, scroll_down, scroll_up, scroll_to_top, scroll_to_bottom, go_back, refresh_page
]






























