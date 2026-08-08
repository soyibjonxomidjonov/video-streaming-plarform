import os

import requests

# TEST_PHRASES = [
#     # Aniq, oddiy buyruqlar (1-2 qatlam uchun)
#     "pauza qil",
#     "davom ettir",
#     "ovozni o'chir",
#     "sal balandroq qil",
#     "10 soniya oldinga o't",
#     "5-daqiqaga o'tkaz",
#     "keyingi qismga o't",
#     "tezlikni ikki barobar qil",
#     "to'liq ekran qil",
#
#     # Chegara holatlar - variativ, lekin baribir tool'ga tegishli
#     "biroz sekinroq bo'lsin",
#     "orqaga qayt",
#     "ovozni butunlay o'chir",
#
#     # ESCALATE bo'lishi SHART bo'lgan holatlar (tool yo'q)
#     "menga kulgili dorama top",
#     "bu qism nima haqida",
#     "salom",
#     "eng yaxshi doramalarni tavsiya qil",
#     "necha qism bor bu doramada",
# ]

# print(route_command("besh yuzi  ellik  to'rt  soniya o'tkizib yubor"))

# TEST_PHRASES_SCROLL = [
#     "pastga tush",
#     "sekin pastga tush",
#     "oxiriga tush",
#     "yuqoriga qaytar",
#     "eng boshiga qaytar",
#     "kirish tugmasini bos",
# ]

# start = time.time()
# for phrase in TEST_PHRASES_SCROLL:
#     result = route_command(phrase)
#     print(f"{phrase} -> {result}")
#     # time.sleep(2)
# print(f"Ketgan vaqt {time.time() - start}")




# def run_tests(human_message):
#     start = time.time()
#     try:
#         response = llm_with_tools.invoke([HumanMessage(content=human_message)])
#         print(response.tool_calls[0])
#
#     except Exception as e:
#         print(f"XATO: {type(e).__name__}: {e}")
#         return
#     print(f"Ketgan vaqt {time.time() - start}")
#
#     if response.tool_calls:
#         for call in response.tool_calls:
#             print(f"TOOL: {call['name']}  |  ARGS: {call['args']}")
#
#     else:
#         print("Hech qanday tool tanlanmadi")




#
# API_KEY = os.environ.get("MOHIR_AI_API_KEY")
#
# def transcribe(audio_file_path):
#     with open(audio_file_path, "rb") as f:
#         response = requests.post(
#             "https://uzbekvoice.ai/api/v1/stt",
#             headers={"Authorization": API_KEY},  # "Bearer" so'zisiz, to'g'ridan-to'g'ri key
#             files={"file": f},
#             data={
#                 "language": "uz",
#                 "model": "enhanced-stt",   # o'zbek uchun MAXSUS optimallashtirilgan model
#                 "blocking": "true",         # natijani darhol kutib olamiz
#                 "return_offsets": "false",
#                 "run_diarization": "false",
#             }
#         )
#     return response
#
# result = transcribe("best_ai.mp3")
# print(result.status_code)
# print(result.text)










import requests

data = {
  "chat_id": 1234566433,
  "username": "soyibjon2",
  "is_admin": True
}

def create(url, data):
    try:
        response = requests.post(url, json=data)
        print("Response Text:", response.text)
        if response.status_code == 201:
            return "OK"
    except Exception as e:
        print(f"Error: {e}")


print(create("http://localhost:8000/v1/bot_users/", data))











