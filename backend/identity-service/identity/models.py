from django.contrib.auth.models import AbstractUser,BaseUserManager
from django.db import models
class UserManager(BaseUserManager):
 use_in_migrations=True
 def create_user(self,email,password=None,**extra):
  if not email: raise ValueError("Email obligatoire")
  user=self.model(email=self.normalize_email(email),**extra); user.set_password(password); user.save(using=self._db); return user
 def create_superuser(self,email,password=None,**extra):
  extra.setdefault("role","ADMIN"); extra.setdefault("is_staff",True); extra.setdefault("is_superuser",True)
  return self.create_user(email,password,**extra)
class User(AbstractUser):
 class Role(models.TextChoices):
  CITOYEN="CITOYEN","Citoyen"; OPERATEUR="OPERATEUR","Opérateur"; TECHNICIEN="TECHNICIEN","Technicien"; ADMIN="ADMIN","Administrateur"
 username=None
 email=models.EmailField(unique=True)
 role=models.CharField(max_length=20,choices=Role.choices,default=Role.CITOYEN)
 phone=models.CharField(max_length=30,blank=True); governorate=models.CharField(max_length=80,blank=True)
 address=models.CharField(max_length=255,blank=True); meter_number=models.CharField(max_length=50,blank=True)
 status=models.CharField(max_length=20,default="ACTIF"); created_at=models.DateTimeField(auto_now_add=True)
 USERNAME_FIELD="email"; REQUIRED_FIELDS=[]; objects=UserManager()
