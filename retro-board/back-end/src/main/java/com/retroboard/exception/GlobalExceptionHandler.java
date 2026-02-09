package com.retroboard.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Handle authentication-related exceptions
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleAuthenticationException(RuntimeException ex, WebRequest request) {
        // Check if the exception message indicates authentication issue
        if (ex.getMessage().startsWith("User not authenticated") || 
            ex.getMessage().startsWith("Access denied")) {
            return new ResponseEntity<>(
                new ErrorResponse(ex.getMessage()), 
                HttpStatus.UNAUTHORIZED
            );
        }
        
        // Handle other runtime exceptions
        return new ResponseEntity<>(
            new ErrorResponse(ex.getMessage()), 
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    // Error response class
    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
