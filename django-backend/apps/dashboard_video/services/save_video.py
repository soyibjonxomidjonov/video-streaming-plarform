import os
import requests
from apps.dashboard_video.services.get_video_test import BOT_TOKEN, LOCAL_API_URL, get_file_id_from_channel, get_local_file_path, get_my_chat_id



def download_video_file(file_id, save_path="video.mp4"):


    response = requests.get(f"{LOCAL_API_URL}/getFile?file_id={file_id}").json()

    if not response.get('ok'):
        print("Fayl yo'lini olib bo'lmadi:", response)
        return False

    file_path = response['result']['file_path']

    download_url = f"{LOCAL_API_URL}/{file_path}"

    with requests.get(download_url, stream=True) as r:
        r.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    print(f"Video muvaffaqiyatli yuklab olindi: {save_path}")
    return True




def main():


    chat_id = get_my_chat_id()
    print(f"Chat ID: {chat_id}")

    file_id = get_file_id_from_channel("videos_for_llm2", 9, chat_id)
    print(f"File ID: {file_id}")

    local_path = get_local_file_path(file_id)
    print(f"Local fayl manzili: {local_path}")


    download_video_file(local_path, "my_video.mp4")








if __name__ == "__main__":
    main()









