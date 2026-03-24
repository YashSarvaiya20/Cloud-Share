FROM maven:3.9.6-eclipse-temurin-17

WORKDIR /app

# Copy everything
COPY . .

# Force rebuild (avoid cache issue)
RUN echo "Rebuilding at $(date)"

# Build project
RUN mvn clean install -DskipTests -U

# Run jar (use exact name)
CMD ["java", "-jar", "target/cloudshareapi-0.0.1-SNAPSHOT.jar"]