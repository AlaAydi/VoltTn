from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView,LoginView,MeView,UsersView,RoleView
urlpatterns=[path("register/",RegisterView.as_view()),path("token/",LoginView.as_view()),
 path("token/refresh/",TokenRefreshView.as_view()),path("me/",MeView.as_view()),
 path("users/",UsersView.as_view()),path("users/<int:pk>/role/",RoleView.as_view())]
