from rest_framework.routers import DefaultRouter
from django.urls import path,include
from .views import OutageViewSet,InterventionViewSet,FraudAlertViewSet
r=DefaultRouter(); r.register("outages",OutageViewSet,basename="outage"); r.register("interventions",InterventionViewSet,basename="intervention"); r.register("fraud-alerts",FraudAlertViewSet,basename="fraud-alert")
urlpatterns=[path("",include(r.urls))]
