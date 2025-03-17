package auth

import (
	"errors"
	"fmt"
	"time"

	"rplace-clone/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

// JWTService handles JWT token generation and validation
type JWTService struct {
	secretKey     string
	tokenDuration time.Duration
}

// NewJWTService creates a new JWT service
func NewJWTService(secretKey string, tokenDuration string) (*JWTService, error) {
	duration, err := time.ParseDuration(tokenDuration)
	if err != nil {
		return nil, fmt.Errorf("invalid token duration: %w", err)
	}

	return &JWTService{
		secretKey:     secretKey,
		tokenDuration: duration,
	}, nil
}

// GenerateToken creates a new JWT token for a user
func (s *JWTService) GenerateToken(user *models.User) (string, error) {
	// Set expiration time
	expirationTime := time.Now().Add(s.tokenDuration)

	// Create claims
	claims := &models.UserClaims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	tokenString, err := token.SignedString([]byte(s.secretKey))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the claims
func (s *JWTService) ValidateToken(tokenString string) (*models.UserClaims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(
		tokenString,
		&models.UserClaims{},
		func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(s.secretKey), nil
		},
	)

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Validate the token
	if !token.Valid {
		return nil, ErrInvalidToken
	}

	// Extract claims
	claims, ok := token.Claims.(*models.UserClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
