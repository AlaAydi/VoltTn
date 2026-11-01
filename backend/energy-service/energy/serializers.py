from rest_framework import serializers
from .models import Meter,Reading,Invoice
class MeterSerializer(serializers.ModelSerializer):
 class Meta: model=Meter; fields="__all__"; read_only_fields=("id","created_at")
class ReadingSerializer(serializers.ModelSerializer):
 class Meta: model=Reading; fields="__all__"; read_only_fields=("id","created_at")
class InvoiceSerializer(serializers.ModelSerializer):
 class Meta: model=Invoice; fields="__all__"; read_only_fields=("id","created_at")
