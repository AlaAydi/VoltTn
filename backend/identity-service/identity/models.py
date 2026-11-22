from django.contrib.auth.models import AbstractUser, BaseUserManager, Group, Permission
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password=None, **extra):
        """
        Create and save a User with the given email and password.
        Handles username automatically since we use email-based auth.
        """
        if not email:
            raise ValueError("Email obligatoire")

        # Pop username from extra if present, otherwise derive from email
        username = extra.pop("username", None)
        if username is None:
            # Derive username from email (part before @)
            username = email.split("@")[0]

        # Ensure the user model gets username set properly
        extra["username"] = username

        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        # Django may call create_user with username as first positional arg
        # Handle both create_user(self, email, password) and create_user(username, email, password)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", "ADMIN")
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        user = self._create_user(email, password, **extra)
        user.role = "ADMIN"
        user.save(using=self._db)
        return user


class User(AbstractUser):
    class Role(models.TextChoices):
        CITOYEN = "CITOYEN", "Citoyen"
        OPERATEUR = "OPERATEUR", "Opérateur"
        TECHNICIEN = "TECHNICIEN", "Technicien"
        ADMIN = "ADMIN", "Administrateur"

    # Keep username as a regular field since USERNAME_FIELD is "email"
    username = models.CharField(max_length=150, unique=False, blank=True)
    email = models.EmailField(unique=True, null=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CITOYEN)
    phone = models.CharField(max_length=30, blank=True)
    governorate = models.CharField(max_length=80, blank=True)
    address = models.CharField(max_length=255, blank=True)
    meter_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, default="ACTIF")
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # Relations ManyToMany with related_name to avoid clashes with auth.User
    groups = models.ManyToManyField(
        Group,
        related_name="identity_user_groups",
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="identity_user_permissions",
        blank=True,
    )

    objects = UserManager()