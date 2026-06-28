FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip

RUN apt-get update && apt-get install -y gcc libpq-dev

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "app.py"]