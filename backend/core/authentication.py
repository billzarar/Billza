import jwt
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication, exceptions

def generate_jwt_tokens(user: User) -> dict:
    now = datetime.now(timezone.utc)
    access_payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': now + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        'iat': now,
        'type': 'access',
    }
    refresh_payload = {
        'user_id': user.id,
        'exp': now + timedelta(days=30),
        'iat': now,
        'type': 'refresh',
    }
    access_token = jwt.encode(access_payload, settings.JWT_SECRET, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET, algorithm='HS256')
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': settings.JWT_EXPIRATION_HOURS * 3600,
    }

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        raw_token = parts[1]
        try:
            payload = jwt.decode(raw_token, settings.JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Authentication token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid authentication token.')

        if payload.get('type') != 'access':
            raise exceptions.AuthenticationFailed('Token type is invalid.')

        try:
            user = User.objects.get(id=payload['user_id'], is_active=True)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User corresponding to token not found or inactive.')

        return (user, raw_token)

    def authenticate_header(self, request):
        return 'Bearer'

try:
    from drf_spectacular.extensions import OpenApiAuthenticationExtension

    class JWTAuthenticationScheme(OpenApiAuthenticationExtension):
        target_class = 'core.authentication.JWTAuthentication'
        name = 'JWTAuth'

        def get_security_definition(self, auto_schema):
            return {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
except ImportError:
    pass
