package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware creates a Gin middleware for JWT authentication
func AuthMiddleware(jwtService *JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header is required"})
			c.Abort()
			return
		}

		// Check if the Authorization header has the correct format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := parts[1]

		// Validate the token
		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			var statusCode int
			var message string

			switch err {
			case ErrExpiredToken:
				statusCode = http.StatusUnauthorized
				message = "token has expired"
			case ErrInvalidToken:
				statusCode = http.StatusUnauthorized
				message = "invalid token"
			default:
				statusCode = http.StatusInternalServerError
				message = "failed to validate token"
			}

			c.JSON(statusCode, gin.H{"error": message})
			c.Abort()
			return
		}

		// Set user information in the context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)

		c.Next()
	}
}
