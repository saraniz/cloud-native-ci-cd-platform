FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# Ensures logs appear immediately in terminal
ENV PYTHONUNBUFFERED=1

# Documents that container uses port 5001
EXPOSE 5001

CMD ["python", "app.py"]