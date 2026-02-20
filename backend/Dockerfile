# Docker Build Configuration

# Stage 1: Build the Maven Project
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code and package the application
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar file from the build stage
COPY --from=build /app/target/voice-translation-0.0.1-SNAPSHOT.jar app.jar

# Expose the application port
EXPOSE 8080

# Environment variables
# The GOOGLE_APPLICATION_CREDENTIALS path should be set at runtime by the hosting provider.
# We expect the provider to offer a "mount file from secret" feature or to write the secret to this path before launch.
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
