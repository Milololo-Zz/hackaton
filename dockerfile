FROM python:3.10-slim

WORKDIR /app

COPY requeriments.txt .

RUN pip install -r requeriments.txt

COPY . .

CMD python manage.py runserver 0.0.0.0:8000