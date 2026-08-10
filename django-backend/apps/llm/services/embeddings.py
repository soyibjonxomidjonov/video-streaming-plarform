import os

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
load_dotenv()

gemini_api = os.environ.get("GEMINI_API_KEY")

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder  = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=gemini_api,
            output_dimensionality=768
        )

    return _embedder


def embed_text(text: str) -> list[float]:
    return get_embedder().embed_query(text)






