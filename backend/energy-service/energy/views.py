from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from .models import Meter,Reading,Invoice
from .serializers import MeterSerializer,ReadingSerializer,InvoiceSerializer
STAFF={"ADMIN","OPERATEUR","TECHNICIEN"}
class MeterViewSet(viewsets.ModelViewSet):
 serializer_class=MeterSerializer
 def get_queryset(self):
  qs=Meter.objects.all()
  return qs if self.request.user.role in STAFF else qs.filter(owner_id=str(self.request.user.id))
 def perform_create(self,serializer):
  u=self.request.user
  owner=self.request.data.get("owner_id",str(u.id)) if u.role in {"ADMIN","OPERATEUR"} else str(u.id)
  serializer.save(owner_id=owner)
class ReadingViewSet(viewsets.ModelViewSet):
 serializer_class=ReadingSerializer
 def get_queryset(self):
  qs=Reading.objects.select_related("meter")
  return qs if self.request.user.role in STAFF else qs.filter(meter__owner_id=str(self.request.user.id))
 def perform_create(self,serializer):
  meter=serializer.validated_data["meter"]
  if self.request.user.role=="CITOYEN" and meter.owner_id!=str(self.request.user.id): raise PermissionDenied()
  serializer.save()
class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
 serializer_class=InvoiceSerializer
 def get_queryset(self):
  qs=Invoice.objects.select_related("meter")
  return qs if self.request.user.role in STAFF else qs.filter(owner_id=str(self.request.user.id))
class DashboardView(APIView):
 def get(self,request):
  meters=Meter.objects.filter(owner_id=str(request.user.id)); invoices=Invoice.objects.filter(owner_id=str(request.user.id))
  return Response({"meters_count":meters.count(),"latest_readings":ReadingSerializer(Reading.objects.filter(meter__in=meters)[:10],many=True).data,
   "unpaid_invoices":InvoiceSerializer(invoices.filter(status="IMPAYEE"),many=True).data,
   "total_unpaid_tnd":invoices.filter(status="IMPAYEE").aggregate(total=Sum("amount_tnd"))["total"] or 0})
