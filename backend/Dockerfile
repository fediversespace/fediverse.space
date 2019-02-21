FROM python:3
ENV PYTHONUNBUFFERED 1

RUN apt-get update && \
    apt-get install -qqy --no-install-recommends \
        postgresql-client-9.6=9.6.10-0+deb9u1

RUN mkdir /code
WORKDIR /code
COPY requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/
