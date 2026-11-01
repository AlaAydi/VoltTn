from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

class TokenUser:
    is_authenticated=True
    is_active=True
    is_anonymous=False
    def __init__(self, uid, role):
        self.id=uid; self.pk=uid; self.role=role
        self.is_staff=role=="ADMIN"; self.is_superuser=role=="ADMIN"

class SharedJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header=request.headers.get("Authorization","")
        if not header: return None
        parts=header.split()
        if len(parts)!=2 or parts[0].lower()!="bearer":
            raise AuthenticationFailed("Format attendu : Bearer <token>.")
        try:
            token=AccessToken(parts[1])
            uid=token.get("user_id"); role=token.get("role","CITOYEN")
            if not uid: raise ValueError("user_id absent")
            return (TokenUser(str(uid),role),token)
        except Exception as exc:
            raise AuthenticationFailed("Jeton invalide ou expiré.") from exc
