from rest_framework import serializers
from .models import Outage,Intervention,FraudAlert
class OutageSerializer(serializers.ModelSerializer):
 class Meta: model=Outage; fields="__all__"; read_only_fields=("id","reporter_id","reported_at","resolved_at","reference")
class InterventionSerializer(serializers.ModelSerializer):
 class Meta: model=Intervention; fields="__all__"; read_only_fields=("id","created_at","completed_at")
class FraudAlertSerializer(serializers.ModelSerializer):
 class Meta: model=FraudAlert; fields="__all__"; read_only_fields=("id","detected_at","reference")
