# Login Workflow Specification

## 1. Overview

This document specifies the authentication and authorization workflow for the PMIS (Project Management Information System). The system uses JWT (JSON Web Tokens) for stateless authentication, with token refresh capabilities to maintain user sessions.

## 2. Authentication Flow

### 2.1 Login Flow

```
User → Login Page → POST /api/users/login → JWT Token → Store Token → Access Protected Resources
```

### 2.2 Complete Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │     Backend     │     │    Database     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  POST /api/users/login│                       │
         │ ──────────────────────>                       │
         │                       │                       │
         │                       │  Find user by email   │
         │                       │ ─────────────────────>│
         │                       │                       │
         │                       │  Verify password      │
         │                       │                       │
         │                       │<───────────────────── │
         │                       │                       │
         │                       │  Generate JWT         │
         │  200 OK { user, token }                       │
         │ <─────────────────────                       │
         │                       │                       │
         │  Store token in:      │                       │
         │  - Cookie (httpOnly) │                       │
         │  - localStorage       │                       │
         │                       │                       │
         │  Access protected     │                       │
         │  resources...         │                       │
```

## 3. Token Management

### 3.1 Token Structure

| Property | Type | Description |
|----------|------|-------------|
| `token` | string | JWT access token |
| `tokenType` | string | Token type (Bearer) |
| `expiresIn` | number | Expiration time in milliseconds |

### 3.2 Token Storage

The token is stored in two locations for redundancy:

1. **HTTP-only Cookie**: For secure token refresh
2. **localStorage**: For easy access in frontend requests

### 3.3 Token Expiration

- Token expiration: 24 hours (86400000 ms)
- Configurable via `jwt.expiration` property in `application.yml`

## 4. API Endpoints

### 4.1 Login Endpoint

**POST /api/users/login**

Request Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200 OK):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Project Manager",
    "teamId": 1
  },
  "token": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000
  }
}
```

### 4.2 Refresh Token Endpoint

**POST /api/auth/refresh**

Request:
- Content-Type: application/json
- Credentials: include (reads token from cookie)

Response (200 OK):
```json
{
  "token": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000
  }
}
```

## 5. Frontend Implementation

### 5.1 API Service (`src/services/api.ts`)

Key functions:

1. **`fetchApi()`**: Core function that:
   - Attaches Authorization header with Bearer token
   - Handles 401 Unauthorized errors
   - Attempts token refresh on 401
   - Retries original request with new token

2. **`refreshToken()`**: Handles token refresh:
   - Calls `/api/auth/refresh` with credentials
   - Updates localStorage and cookie with new token

3. **`getAuthToken()`**: Retrieves token from:
   - Cookie (via `getCookie()`)
   - localStorage (fallback)

### 5.2 Token Refresh Logic

```typescript
// On 401 response:
if (response.status === 401 && retryCount < 1) {
  const newToken = await refreshToken();
  if (newToken) {
    return fetchApi<T>(endpoint, options, newToken, retryCount + 1);
  }
}
```

### 5.3 Cookie Management

```typescript
// Set cookie (expires in 1 day)
function setCookie(name: string, value: string, days: number = 1) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}
```

## 6. Backend Implementation

### 6.1 Security Configuration (`SecurityConfig.java`)

- CSRF: Disabled (stateless JWT authentication)
- Session Management: Stateless
- Public Endpoints:
  - `/api/users/login` - User login
  - `/api/users` - User registration
  - `/api/auth/refresh` - Token refresh
  - `/swagger-ui/**`, `/api-docs/**` - API documentation
- All other endpoints require authentication

### 6.2 JWT Authentication Filter (`JwtAuthenticationFilter.java`)

Filter flow:
1. Extract Authorization header
2. Validate JWT token
3. Extract user email from token
4. Load user from database
5. Set authentication in SecurityContext
6. Continue filter chain

### 6.3 User Service (`UserService.java`)

Key methods:

1. **`login(AuthDTO)`**: Validates credentials and returns user + token
2. **`refreshToken(String)`**: Validates existing token and returns new token

### 6.4 Auth Controller (`AuthController.java`)

- `/api/auth/refresh`: Reads token from cookie and returns new token

## 7. Database Schema

### 7.1 User Table (`app_user`)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `password` | VARCHAR(255) | NOT NULL (BCrypt hashed) |
| `name` | VARCHAR(255) | NOT NULL |
| `role` | VARCHAR(50) | NOT NULL |
| `team_id` | BIGINT | FOREIGN KEY |
| `organization_id` | BIGINT | FOREIGN KEY |
| `department_id` | BIGINT | FOREIGN KEY |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

## 8. Security Considerations

### 8.1 Password Storage
- All passwords are hashed using BCrypt
- Cost factor: 10 (default Spring Security BCryptPasswordEncoder)

### 8.2 Token Security
- JWT tokens are signed using HS256 algorithm
- Secret key is configurable via `jwt.secret` property
- Token includes user email as subject

### 8.3 CORS Configuration

```java
// WebConfig.java
config.setAllowCredentials(true);
config.setAllowedOrigins(Arrays.asList(
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002"
));
config.setAllowedMethods(Arrays.asList(
  "GET", "POST", "PUT", "DELETE", "OPTIONS"
));
```

### 8.4 Error Handling

| HTTP Status | Error Message | Scenario |
|-------------|---------------|----------|
| 401 | Unauthorized | Missing or invalid token |
| 401 | Invalid credentials | Token refresh failed |
| 403 | Access denied | Insufficient permissions |

## 9. Edge Cases

### 9.1 Token Expiry During Session
- Frontend detects 401 response
- Automatically refreshes token
- Retries failed request
- User experience remains uninterrupted

### 9.2 Simultaneous Refresh Requests
- Uses `isRefreshing` flag to prevent duplicate refresh calls
- Multiple requests wait for single refresh promise

### 9.3 Logout
- Clear token from localStorage
- Clear token from cookie
- Redirect to login page

## 10. Sequence Diagram

```
User          Frontend        Backend         Database
  |              |              |                |
  |--Login------>|              |                |
  |              |--POST /login>|                |
  |              |              |--SELECT user   |
  |              |              |<--user data----|
  |              |              |--Generate JWT  |
  |              |<--200 OK-----|                |
  |<--Store token|              |                |
  |              |              |                |
  |--API Call--->|              |                |
  |              |--GET /data-->|                |
  |              |<--200 OK-----|                |
  |<--Display---|              |                |
  |              |              |                |
  |--Token expires--|          |                |
  |--API Call--->|              |                |
  |              |--GET /data-->|                |
  |              |<--401-------|                |
  |              |--POST /refresh>|              |
  |              |<--200 OK-----|                |
  |              |--GET /data-->|                |
  |              |<--200 OK-----|                |
  |<--Display---|              |                |
```

## 11. Configuration

### 11.1 Backend (`application.yml`)

```yaml
jwt:
  secret: pmis-jwt-secret-key-2026-project-management-information-system
  expiration: 86400000
  issuer: pmis-app
```

### 11.2 Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8088/api
```

## 12. Testing

### 12.1 Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-001 | Valid credentials | User logged in, token returned |
| TC-002 | Invalid password | 401 error returned |
| TC-003 | Non-existent user | 401 error returned |
| TC-004 | Token refresh | New token returned |
| TC-005 | Expired token | 401 error, refresh succeeds |
| TC-006 | Protected endpoint without token | 401 error |
| TC-007 | Protected endpoint with valid token | 200 OK |

### 12.2 Security Tests

- Test password hashing with BCrypt
- Test token tampering detection
- Test CORS configuration
- Test CSRF protection (disabled for stateless)

## 13. References

- JWT Specification: RFC 7519
- BCrypt: https://en.wikipedia.org/wiki/Bcrypt
- Spring Security: https://spring.io/projects/spring-security
- Next.js Authentication: https://nextjs.org/docs/authentication