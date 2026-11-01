from rest_framework import serializers
from .models import User
class UserSerializer(serializers.ModelSerializer):
 class Meta:
  model=User; fields=("id","email","first_name","last_name","role","phone","governorate","address","meter_number","status","created_at")
  read_only_fields=("id","role","status","created_at")
class RegisterSerializer(serializers.ModelSerializer):
 password=serializers.CharField(write_only=True,min_length=10)
 class Meta:
  model=User; fields=("id","email","password","first_name","last_name","phone","governorate","address","meter_number")
 def create(self,data): return User.objects.create_user(**data,role="CITOYEN")
