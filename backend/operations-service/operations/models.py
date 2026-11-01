from django.db import models
class Outage(models.Model):
 reference=models.CharField(max_length=50,unique=True); reporter_id=models.CharField(max_length=64,db_index=True)
 governorate=models.CharField(max_length=80); district=models.CharField(max_length=100,blank=True); address=models.CharField(max_length=255)
 latitude=models.DecimalField(max_digits=9,decimal_places=6,null=True,blank=True); longitude=models.DecimalField(max_digits=9,decimal_places=6,null=True,blank=True)
 outage_type=models.CharField(max_length=40); status=models.CharField(max_length=20,default="SIGNALE"); severity=models.CharField(max_length=20,default="MOYENNE")
 affected_customers=models.PositiveIntegerField(default=0); assigned_technician_id=models.CharField(max_length=64,blank=True)
 notes=models.TextField(blank=True); reported_at=models.DateTimeField(auto_now_add=True); resolved_at=models.DateTimeField(null=True,blank=True)
class Intervention(models.Model):
 outage=models.ForeignKey(Outage,on_delete=models.SET_NULL,null=True,blank=True,related_name="interventions")
 technician_id=models.CharField(max_length=64,db_index=True); title=models.CharField(max_length=160); description=models.TextField(blank=True)
 scheduled_at=models.DateTimeField(null=True,blank=True); completed_at=models.DateTimeField(null=True,blank=True)
 status=models.CharField(max_length=20,default="PLANIFIEE"); created_at=models.DateTimeField(auto_now_add=True)
class FraudAlert(models.Model):
 reference=models.CharField(max_length=50,unique=True); meter_number=models.CharField(max_length=50)
 customer_reference=models.CharField(max_length=100,blank=True); governorate=models.CharField(max_length=80)
 suspicion_score=models.PositiveSmallIntegerField(); anomaly_type=models.CharField(max_length=180)
 estimated_loss_tnd=models.DecimalField(max_digits=12,decimal_places=3,default=0)
 status=models.CharField(max_length=20,default="NOUVEAU"); inspector_notes=models.TextField(blank=True); detected_at=models.DateTimeField(auto_now_add=True)
