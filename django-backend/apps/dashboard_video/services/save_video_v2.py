import os
import re
import requests
import subprocess

from dotenv import load_dotenv

load_dotenv()


BOT_TOKEN = os.environ.get("BOT_TOKEN")


CONTAINER_NAME = "telegram-bot-api"

# LOCAL_API_URL = f"http://127.0.0.1:8080/bot{BOT_TOKEN}"
LOCAL_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

HOST_MOUNT_PATH = r"D:\telegram_files"
CONTAINER_BASE_PATH = "var/lib/telegram-bot-api"



def parse_telegram_link(link: str):
    """https://t.me/kanal_nomi/9 -> ('kanal_nomi', 9)"""
    match = re.match(r"https?://t\.me/([^/]+)/(\d+)(?:/(\d+))?", link)
    if not match:
        raise ValueError(f"Link formatini tushunib bo'lmadi: {link}")
    channel_username, first_num, second_num = match.groups()
    message_id = int(second_num) if second_num else int(first_num)
    return channel_username, message_id



def get_my_chat_id() -> int:
    """Botga /start yozgan bo'lishingiz shart — shundan keyin ishlaydi."""
    print(LOCAL_API_URL)
    resp = requests.get(f"{LOCAL_API_URL}/getUpdates").json()
    if not resp.get('result'):
        raise RuntimeError("Botga hali /start yubormagansiz")
    for update in reversed(resp['result']):
        if 'message' in  update:
            return update['message']['chat']['id']


    raise RuntimeError("'message' turi topilmadi — /start qaytadan yuboring")


def get_file_id(channel_username: str, message_id: int, my_chat_id: int) -> str:
    """Kanaldagi xabarni o'zimizga forward qilib, file_id ni olamiz."""
    resp = requests.get(f"{LOCAL_API_URL}/forwardMessage", params={
        'chat_id': my_chat_id,
        'from_chat_id': f"@{channel_username}",
        'message_id': message_id,
    }).json()

    if not resp.get('ok'):
        raise RuntimeError(f"Forward xato: {resp}")


    message = resp['result']
    video = message.get('video') or message.get('document')
    if not video:
        raise RuntimeError("Bu xabarda video/fayl topilmadi")
    return video['file_id']



def get_container_file_path(file_id: str) -> str:
    """getFile — LOCAL rejimda, video BUTUN holda konteyner diskiga tushadi."""
    resp = requests.get(f"{LOCAL_API_URL}/getFile", params={'file_id': file_id}).json()
    if not resp.get("ok"):
        raise RuntimeError(f"getFile xato: {resp}")
    return resp["result"]["file_path"]




def copy_video_out_of_container(container_file_path: str, save_path: str):
    """
    docker cp — faylni konteyner ICHIDAN (Linux fayl tizimidan) o'qiydi,
    shuning uchun Windows'ning ':' bilan bog'liq cheklovi bu yerda ishlamaydi.
    """
    result = subprocess.run(
        ["docker", "cp", f"{CONTAINER_NAME}:{container_file_path}", save_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"docker cp xato berdi: {result.stderr}")
    print(f"Video muvaffaqiyatli ko'chirildi: {save_path}")

def download_from_link(telegram_link: str, save_path: str):
    channel, message_id = parse_telegram_link(telegram_link)
    print(f"Kanal: {channel}, Xabar: {message_id}")

    chat_id = get_my_chat_id()
    file_id = get_file_id(channel, message_id, chat_id)
    print(f"File ID: {file_id}")

    container_path = get_container_file_path(file_id)

    copy_video_out_of_container(container_path, save_path)


    cleanup_result = subprocess.run(
        ["docker", "exec", CONTAINER_NAME, "rm", "-f", container_path],
        capture_output=True, text=True,
    )

    if cleanup_result.returncode != 0:
        print(f"Ogohlantirish: konteynerdan tozalab bo'lmadi: {cleanup_result.stderr}")
    else:
        print(f"Konteyner ichidagi nusxa o'chirildi: {container_path}")



if __name__ == "__main__":
    download_from_link("https://t.me/videos_for_llm2/1/11", "my_video.mp4")













































