# 1단계: 빌드 환경 설정 (Maven + Java 17)
FROM maven:3.8.5-openjdk-17 AS build
COPY . /home/app
WORKDIR /home/app
RUN mvn clean package -DskipTests

# 2단계: 실행 환경 설정 (Java 17 경량화 버전)
FROM openjdk:17-jdk-slim
EXPOSE 8080
COPY --from=build /home/app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
