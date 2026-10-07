# 1단계: 빌드 환경 (Maven + Java 17)
FROM maven:3.8.5-openjdk-17 AS build
COPY . /home/app
WORKDIR /home/app
# 로컬 전용 설정 파일이 포함되어 있더라도 운영 빌드 시 안전하게 사전 제거
RUN rm -f /home/app/src/main/resources/config/*.local.properties
RUN mvn clean package -DskipTests

# 2단계: 실행 환경 (공식 Tomcat 9 + Java 17)
FROM tomcat:9.0-jdk17-openjdk-slim

# 서버 타임존을 한국(KST, UTC+9)으로 설정 - 게시글 작성 시간 KST 기준 적용
ENV TZ=Asia/Seoul
ENV JAVA_OPTS="-Duser.timezone=Asia/Seoul"

# 기본 ROOT 애플리케이션 삭제 후 빌드된 war 파일을 Tomcat 웹 디렉토리로 복사
RUN rm -rf /usr/local/tomcat/webapps/ROOT
COPY --from=build /home/app/target/*.war /usr/local/tomcat/webapps/ROOT.war

# 톰캣 기본 포트 개방
EXPOSE 8080
CMD ["catalina.sh", "run"]
