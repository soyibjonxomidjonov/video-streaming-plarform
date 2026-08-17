import os
from dotenv import load_dotenv
import requests
load_dotenv()



BOT_TOKEN = os.environ.get("BOT_TOKEN")

LOCAL_API_URL = f"http://localhost:8081/bot{BOT_TOKEN}"


def get_my_chat_id():
    resp = requests.get(f"{LOCAL_API_URL}/getUpdates").json()

    # print("Xom javob:", resp)  # debug uchun — nima kelayotganini ko'ramiz



    if not resp.get("result"):
        raise RuntimeError("Hali botga xabar yubormagansiz — Telegram'da botga /start yozing")


    # return resp["result"][-1]["message"]["chat"]["id"]
    return resp['result'][-1]['message']['chat']['id']



def get_file_id_from_channel(channel_username: str, message_id:int, my_chat_id: int) -> str:

    resp = requests.get(f"{LOCAL_API_URL}/forwardMessage", params={
        "chat_id": my_chat_id,
        "from_chat_id": f"@{channel_username}",
        'message_id': message_id,
    }
                        ).json()

    if not resp.get("ok"):
        raise RuntimeError(f"Forward xato: {resp}")

    message = resp['result']
    video = message.get('video') or message.get('document')

    if not video:
        raise RuntimeError("Bu xabarda video topilmadi")

    return video['file_id']


def get_local_file_path(file_id: str) -> str:
    resp = requests.get(f"{LOCAL_API_URL}/getFile", params={'file_id': file_id}).json()

    if not resp.get('ok'):
        raise RuntimeError(f"getFile xato: {resp}")
    
    return resp['result']['file_path']





















def download_video_file(file_id, save_path="video.mp4"):


    response = requests.get(f"{LOCAL_API_URL}/getFile?file_id={file_id}").json()

    if not response.get('ok'):
        print("Fayl yo'lini olib bo'lmadi:", response)
        return False

    file_path = response['result']['file_path']



    download_url = f"http://localhost:8081/file/bot{BOT_TOKEN}/{file_path}"


    with requests.get(download_url, stream=True) as r:
        r.raise_for_status()
        with open(save_path, 'wb') as f:# if __name__ == "__main__":
            for chunk in r.iter_content(chunk_size=8192):    # chat_id = get_my_chat_id()
                f.write(chunk)    # print(f"Chat ID: {chat_id}")
    #
    print(f"Video muvaffaqiyatli yuklab olindi: {save_path}")    # file_id = get_file_id_from_channel("videos_for_llm2", 9, chat_id)
    return True    # print(f"File ID: {file_id}")
    #
    # local_path = get_local_file_path(file_id)
    # print(f"Local fayl manzili: {local_path}")

def main():


    chat_id = get_my_chat_id()
    # print(f"Chat ID: {chat_id}")

    file_id = get_file_id_from_channel("videos_for_llm2", 9, chat_id)
    # print(f"File ID: {file_id}")

    local_path = get_local_file_path(file_id)
    print(f"Local fayl manzili: {local_path}")


    download_video_file(local_path, "my_video.mp4")


if __name__ == "__main__":
    main()



















    