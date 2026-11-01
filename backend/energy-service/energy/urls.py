from rest_framework.routers import DefaultRouter
from django.urls import path,include
from .views import MeterViewSet,ReadingViewSet,InvoiceViewSet,DashboardView
r=DefaultRouter(); r.register("meters",MeterViewSet,basename="meter"); r.register("readings",ReadingViewSet,basename="reading"); r.register("invoices",InvoiceViewSet,basename="invoice")
urlpatterns=[path("",include(r.urls)),path("dashboard/",DashboardView.as_view())]
