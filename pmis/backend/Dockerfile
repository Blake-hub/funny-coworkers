# Backend image: single stage, COPY a jar pre-built on the dev machine
# Build prerequisite: run ./gradlew bootJar in the backend/ directory to produce build/libs/*.jar
# Build: docker build -t pmis-backend:1.0.0 ./backend

FROM eclipse-temurin:17-jre-alpine

# Install timezone data so JVM and OS both know Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

ENV TZ=Asia/Shanghai

WORKDIR /app

# Upload directory (corresponds to app.upload.dir in application.yml; compose mounts a volume for persistence)
RUN mkdir -p /app/uploads

# Copy the pre-built fat jar
COPY build/libs/*.jar app.jar

EXPOSE 8080

# -Duser.timezone forces JVM default timezone to Asia/Shanghai
ENTRYPOINT ["java", "-Duser.timezone=Asia/Shanghai", "-jar", "app.jar"]
