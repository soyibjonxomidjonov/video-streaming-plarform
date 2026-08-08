import os

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
load_dotenv()

gemini_api = os.environ.get("GEMINI_API_KEY")


embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=gemini_api,
    output_dimensionality=768
)






