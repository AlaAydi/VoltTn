import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [v.strip() for v in os.getenv("ALLOWED_HOSTS", "localhost").split(",") if v.strip()]
INSTALLED_APPS = [
 "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
 "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
 "rest_framework","corsheaders","drf_spectacular",
]
MIDDLEWARE = [
 "django.middleware.security.SecurityMiddleware","corsheaders.middleware.CorsMiddleware",
 "django.contrib.sessions.middleware.SessionMiddleware","django.middleware.common.CommonMiddleware",
 "django.middleware.csrf.CsrfViewMiddleware","django.contrib.auth.middleware.AuthenticationMiddleware",
 "django.contrib.messages.middleware.MessageMiddleware","django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF="config.urls"
TEMPLATES=[{"BACKEND":"django.template.backends.django.DjangoTemplates","DIRS":[],"APP_DIRS":True,
 "OPTIONS":{"context_processors":["django.template.context_processors.debug","django.template.context_processors.request",
 "django.contrib.auth.context_processors.auth","django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION="config.wsgi.application"
DATABASES={"default":{"ENGINE":"django.contrib.gis.db.backends.postgis","NAME":os.getenv("DB_NAME"),
 "USER":os.getenv("POSTGRES_USER","volttn"),"PASSWORD":os.getenv("POSTGRES_PASSWORD",""),
 "HOST":os.getenv("DB_HOST","postgres"),"PORT":os.getenv("DB_PORT","5432"),"CONN_MAX_AGE":60}}
AUTH_PASSWORD_VALIDATORS=[
 {"NAME":"django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
 {"NAME":"django.contrib.auth.password_validation.MinimumLengthValidator"},
 {"NAME":"django.contrib.auth.password_validation.CommonPasswordValidator"},
 {"NAME":"django.contrib.auth.password_validation.NumericPasswordValidator"}]
LANGUAGE_CODE="fr-fr"; TIME_ZONE="Africa/Tunis"; USE_I18N=True; USE_TZ=True
STATIC_URL="static/"; DEFAULT_AUTO_FIELD="django.db.models.BigAutoField"
CORS_ALLOWED_ORIGINS=[v.strip() for v in os.getenv("CORS_ALLOWED_ORIGINS","http://localhost:4200").split(",") if v.strip()]
REST_FRAMEWORK={"DEFAULT_AUTHENTICATION_CLASSES":["shared.authentication.SharedJWTAuthentication"],
 "DEFAULT_PERMISSION_CLASSES":["rest_framework.permissions.IsAuthenticated"],
 "DEFAULT_SCHEMA_CLASS":"drf_spectacular.openapi.AutoSchema",
 "DEFAULT_PAGINATION_CLASS":"rest_framework.pagination.PageNumberPagination","PAGE_SIZE":20}
SPECTACULAR_SETTINGS={"TITLE":"VoltTN API","DESCRIPTION":"Backend REST VoltTN","VERSION":"1.0.0"}

INSTALLED_APPS += ["energy"]

SIMPLE_JWT={"SIGNING_KEY":os.getenv("JWT_SIGNING_KEY",SECRET_KEY),"ALGORITHM":"HS256","AUTH_HEADER_TYPES":("Bearer",)}
