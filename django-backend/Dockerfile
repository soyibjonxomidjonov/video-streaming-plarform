FROM python:3.12-slim
WORKDIR /app

RUN pip install --no-cache-dir uv

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]