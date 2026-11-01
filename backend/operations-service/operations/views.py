from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Outage,Intervention,FraudAlert
from .serializers import OutageSerializer,InterventionSerializer,FraudAlertSerializer
STAFF={"ADMIN","OPERATEUR","TECHNICIEN"}
class OutageViewSet(viewsets.ModelViewSet):
 serializer_class=OutageSerializer
 def get_queryset(self):
  q=Outage.objects.all().order_by("-reported_at")
  return q if self.request.user.role in STAFF else q.filter(reporter_id=str(self.request.user.id))
 def perform_create(self,s):
  s.save(reporter_id=str(self.request.user.id),reference="INC-"+timezone.now().strftime("%Y%m%d%H%M%S%f"))
 @action(detail=True,methods=["patch"],url_path="status")
 def update_status(self,request,pk=None):
  if request.user.role not in STAFF: raise PermissionDenied()
  obj=self.get_object(); value=request.data.get("status")
  if value not in {"SIGNALE","EN_COURS","RESOLU"}: return Response({"detail":"Statut invalide"},status=400)
  obj.status=value
  if value=="RESOLU": obj.resolved_at=timezone.now()
  obj.save(); return Response(self.get_serializer(obj).data)
class InterventionViewSet(viewsets.ModelViewSet):
 serializer_class=InterventionSerializer
 def get_queryset(self):
  q=Intervention.objects.all().order_by("-created_at")
  if self.request.user.role=="TECHNICIEN": return q.filter(technician_id=str(self.request.user.id))
  if self.request.user.role=="CITOYEN": return q.none()
  return q
 def perform_create(self,s):
  if self.request.user.role not in {"ADMIN","OPERATEUR"}: raise PermissionDenied()
  s.save()
class FraudAlertViewSet(viewsets.ModelViewSet):
 serializer_class=FraudAlertSerializer
 http_method_names=["get","post","patch","head","options"]
 def get_queryset(self):
  if self.request.user.role not in {"ADMIN","OPERATEUR"}: raise PermissionDenied()
  return FraudAlert.objects.all().order_by("-detected_at")
 def perform_create(self,s):
  if self.request.user.role not in {"ADMIN","OPERATEUR"}: raise PermissionDenied()
  s.save(reference="FRD-"+timezone.now().strftime("%Y%m%d%H%M%S%f"))
 @action(detail=True,methods=["patch"],url_path="status")
 def update_status(self,request,pk=None):
  obj=self.get_object(); value=request.data.get("status")
  if value not in {"NOUVEAU","EN_INSPECTION","VALIDE","REJETE"}: return Response({"detail":"Statut invalide"},status=400)
  obj.status=value; obj.inspector_notes=request.data.get("inspector_notes",obj.inspector_notes); obj.save()
  return Response(self.get_serializer(obj).data)
