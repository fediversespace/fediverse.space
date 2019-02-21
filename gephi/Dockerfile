FROM openjdk:11.0.2-jdk-slim

RUN mkdir /code
WORKDIR /code

COPY build.gradle gradlew /code/
COPY gradle /code/gradle
COPY lib /code/lib
RUN ./gradlew tasks

COPY src /code/src

RUN ./gradlew shadowJar
