# Retro Board Backend

The backend service for the Retro Board Application, providing secure API endpoints for user authentication, board management, and real-time collaboration features. Built with Spring Boot, Java, and PostgreSQL, this service ensures reliable data persistence and secure access control.

## 📋 Project Overview

The Retro Board Backend is a RESTful API service that powers the collaborative retro board application. It handles user authentication, data persistence, and business logic for the frontend application, enabling teams to conduct effective retrospectives with real-time collaboration features.

## ✨ Key Features

### Authentication
- **User Registration**: Secure user account creation with username, password, and email validation
- **User Login**: JWT-based authentication with secure token generation and validation
- **Password Encryption**: BCrypt password hashing for enhanced security

### API Endpoints
- **RESTful Architecture**: Well-structured API endpoints following REST principles
- **Error Handling**: Consistent error responses with appropriate HTTP status codes
- **Input Validation**: Request data validation to ensure data integrity

### Database Management
- **PostgreSQL Integration**: Robust relational database for data persistence
- **Flyway Migrations**: Version-controlled database schema management
- **JPA Entities**: Object-relational mapping for seamless data access

### Security
- **JWT Authentication**: Stateless session management with JSON Web Tokens
- **CORS Configuration**: Secure cross-origin resource sharing
- **Spring Security**: Comprehensive security framework integration

### Testing
- **Unit Tests**: Comprehensive test coverage for business logic
- **Mockito Integration**: Mocking framework for isolated testing
- **JUnit 5**: Modern testing framework for Java applications

## 🛠️ Technical Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL 16+
- **ORM**: Spring Data JPA
- **Security**: Spring Security + JWT
- **Database Migrations**: Flyway
- **API Documentation**: SpringDoc OpenAPI
- **Testing**: JUnit 5 + Mockito

## 📦 Installation

### Prerequisites
- Java 17+
- PostgreSQL 16+
- Gradle build tool

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd funny-coworkers/retro-board/back-end
   ```

2. **Configure PostgreSQL Database**
   ```sql
   -- Create database
   CREATE DATABASE retroboard;
   
   -- Create user (if not exists)
   CREATE USER postgres WITH PASSWORD '123456';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE retroboard TO postgres;
   ```

3. **Update Database Configuration**
   Edit `src/main/resources/application.properties` if needed:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/retroboard
   spring.datasource.username=postgres
   spring.datasource.password=123456
   ```

4. **Build and Run the Application**
   ```bash
   # Build the application
   ./gradlew build
   
   # Run the application
   ./gradlew bootRun
   ```

   The application will start on `http://localhost:8081`

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|-------------|------------------|
| POST | `/register` | Register a new user | `{"username": "...", "password": "...", "email": "..."}` | `201 Created` with token |
| POST | `/login` | User login | `{"username": "...", "password": "..."}` | `200 OK` with token |

### Sample Requests

#### Register User
```bash
curl -X POST http://localhost:8081/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123", "email": "test@example.com"}'
```

#### Login User
```bash
curl -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Error Responses

| Status Code | Description | Sample Response |
|-------------|-------------|----------------|
| 400 | Bad Request | `{"message": "Invalid input data"}` |
| 401 | Unauthorized | `{"message": "Invalid credentials"}` |
| 409 | Conflict | `{"message": "Username already exists"}` |
| 500 | Internal Server Error | No response body |

## 📁 Project Structure

```
src/
├── main/
│   ├── java/com/retroboard/
│   │   ├── controller/         # API controllers
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── entity/             # JPA entities
│   │   ├── filter/             # JWT authentication filter
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── service/            # Business logic services
│   │   ├── util/               # Utility classes
│   │   └── RetroBoardApplication.java # Main application class
│   └── resources/
│       ├── db/migration/       # Flyway database migrations
│       └── application.properties # Application configuration
└── test/                       # Unit tests
    └── java/com/retroboard/
        ├── controller/         # Controller tests
        └── service/            # Service tests
```

## 📜 Available Gradle Tasks

| Task          | Description                               |
|---------------|-------------------------------------------|
| `./gradlew bootRun` | Start the application                     |
| `./gradlew build`   | Build the application                     |
| `./gradlew test`    | Run unit tests                            |
| `./gradlew clean`   | Clean build artifacts                     |
| `./gradlew check`   | Run code quality checks                   |

## 🔧 Database Migrations

The backend uses Flyway for database schema management. Migrations are located in `src/main/resources/db/migration/`:

- **V1__Create_users_table.sql**: Creates the users table
- **V2__Add_disabled_field_to_users.sql**: Adds the disabled field to users table

## 📝 Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `spring.datasource.url` | PostgreSQL database URL | `jdbc:postgresql://localhost:5432/retroboard` |
| `spring.datasource.username` | Database username | `postgres` |
| `spring.datasource.password` | Database password | `123456` |
| `jwt.secret` | JWT signing secret | `your-secret-key-change-in-production` |
| `jwt.expiration` | JWT token expiration (ms) | `86400000` (24 hours) |
| `jwt.issuer` | JWT token issuer | `retroboard-api` |

## 🧪 Testing

### Running Tests
```bash
./gradlew test
```

### Test Coverage
- **AuthenticationService**: Tests for user registration and login
- **AuthenticationController**: Tests for API endpoint behavior
- **Error Handling**: Tests for various error scenarios

## 🎯 Usage Examples

### 1. User Registration Flow
1. Client sends POST request to `/register` with user data
2. Server validates input and checks for existing users
3. Server creates new user with encrypted password
4. Server generates JWT token and returns it to client
5. Client stores token for subsequent requests

### 2. User Login Flow
1. Client sends POST request to `/login` with credentials
2. Server validates credentials using Spring Security
3. Server generates JWT token and returns it to client
4. Client stores token for subsequent requests

## 📄 API Documentation

API documentation is available at:
- **Swagger UI**: `http://localhost:8081/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8081/v3/api-docs`

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a new branch
3. Make your changes
4. Run tests to ensure code quality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 📞 Support

For questions or issues, please contact the development team or open an issue in the repository.

---

**Happy Coding!** 🚀
