from rest_framework import generics,permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from .serializers import UserSerializer,RegisterSerializer
class VoltTokenSerializer(TokenObtainPairSerializer):
 @classmethod
 def get_token(cls,user):
  token=super().get_token(user); token["role"]=user.role; token["email"]=user.email; return token
 def validate(self,attrs):
  data=super().validate(attrs); data["user"]=UserSerializer(self.user).data; return data
class RegisterView(generics.CreateAPIView):
 queryset=User.objects.all(); serializer_class=RegisterSerializer; permission_classes=[permissions.AllowAny]
class LoginView(TokenObtainPairView):
 serializer_class=VoltTokenSerializer; permission_classes=[permissions.AllowAny]
class MeView(APIView):
 def get(self,request): return Response(UserSerializer(request.user).data)
 def patch(self,request):
  s=UserSerializer(request.user,data=request.data,partial=True); s.is_valid(raise_exception=True); s.save(); return Response(s.data)
class UsersView(generics.ListAPIView):
 queryset=User.objects.all().order_by("-date_joined"); serializer_class=UserSerializer; permission_classes=[permissions.IsAdminUser]
class RoleView(APIView):
 permission_classes=[permissions.IsAdminUser]
 def patch(self,request,pk):
  try: u=User.objects.get(pk=pk)
  except User.DoesNotExist: return Response({"detail":"Utilisateur introuvable"},status=404)
  role=request.data.get("role")
  if role not in User.Role.values: return Response({"detail":"Rôle invalide"},status=400)
  u.role=role; u.save(update_fields=["role"]); return Response(UserSerializer(u).data)
