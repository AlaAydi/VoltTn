from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken


class TokenUser:
    """
    A lightweight user object attached to the request by SharedJWTAuthentication.
    Contains the essential fields needed for serialization and permission checks.
    """
    is_authenticated = True
    
    def __init__(self, uid, role, **extra_fields):
        self.id = uid
        self.pk = uid
        self.role = role
        self.is_active = True
        self.is_staff = role == "ADMIN"
        self.is_superuser = role == "ADMIN"
        
        # Copy additional fields from the JWT token
        for key, value in extra_fields.items():
            setattr(self, key, value)


class SharedJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header:
            return None
        
        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed("Format attendu : Bearer <token>.")
        
        try:
            token = AccessToken(parts[1])
            uid = token.get("user_id")
            role = token.get("role", "CITOYEN")
            
            if not uid:
                raise ValueError("user_id absent")
            
            # Extract additional fields from the token
            extra_fields = {}
            for key in ["email", "first_name", "last_name", "phone", "governorate", 
                       "address", "meter_number", "status"]:
                if key in token:
                    extra_fields[key] = str(token[key])
            
            return (TokenUser(str(uid), role, **extra_fields), token)
            
        except Exception as exc:
            raise AuthenticationFailed("Jeton invalide ou expiré.") from exc