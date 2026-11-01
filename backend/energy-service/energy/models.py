from django.db import models
class Meter(models.Model):
 owner_id=models.CharField(max_length=64,db_index=True); meter_number=models.CharField(max_length=50,unique=True)
 client_code=models.CharField(max_length=50,blank=True); governorate=models.CharField(max_length=80); address=models.CharField(max_length=255)
 status=models.CharField(max_length=20,default="ACTIF"); installed_at=models.DateField(null=True,blank=True); created_at=models.DateTimeField(auto_now_add=True)
 def __str__(self): return self.meter_number
class Reading(models.Model):
 meter=models.ForeignKey(Meter,on_delete=models.CASCADE,related_name="readings")
 recorded_at=models.DateTimeField(db_index=True); index_kwh=models.DecimalField(max_digits=12,decimal_places=3)
 power_kw=models.DecimalField(max_digits=8,decimal_places=3,null=True,blank=True); source=models.CharField(max_length=30,default="MANUAL")
 created_at=models.DateTimeField(auto_now_add=True)
 class Meta: ordering=["-recorded_at"]
class Invoice(models.Model):
 owner_id=models.CharField(max_length=64,db_index=True); meter=models.ForeignKey(Meter,on_delete=models.PROTECT,related_name="invoices")
 reference=models.CharField(max_length=50,unique=True); period_start=models.DateField(); period_end=models.DateField()
 consumption_kwh=models.DecimalField(max_digits=12,decimal_places=3); amount_tnd=models.DecimalField(max_digits=12,decimal_places=3)
 due_date=models.DateField(); status=models.CharField(max_length=20,default="IMPAYEE"); created_at=models.DateTimeField(auto_now_add=True)
