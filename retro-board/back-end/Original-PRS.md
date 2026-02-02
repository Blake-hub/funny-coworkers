# This is retor-board back-end PRS, this document describes the API requirements which is used to interact with the retor-board front-end.

## Api requirements
1. login: /login (POST), request body: {username: string, password: string}, response body: {token: string}
2. register: /register (POST), request body: {username: string, password: string, email: string}, response body: {token: string}

## Technical requirements
1. The back-end server should be implemented in java 17.
2. The database should be postgresql.
3. The API should follow RESTful principles.
4. The API should be secured with JWT (JSON Web Tokens).
5. The back-end server base on spring boot.
6. The back-end server will use Swagger UI to document the API.
7. The back-end server will use lombok to reduce boilerplate code.
8. The back-end server should integrate flyway to manage database migrations.
9. use gradle to build the project.