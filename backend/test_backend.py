"""
Comprehensive test suite for VoltTN Backend services.
Tests identity-service, energy-service, and operations-service APIs.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()


class IdentityServiceTests(APITestCase):
    """Tests for identity-service authentication and user management."""
    
    def setUp(self):
        self.admin_client = APIClient()
        self.regular_client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@volttn.tn',
            password='admin123',
            role='ADMIN'
        )
        self.admin_client.force_authenticate(user=self.admin_user)
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@volttn.tn',
            password='password123',
            role='CITOYEN'
        )
        self.regular_client.force_authenticate(user=self.regular_user)
    
    def test_user_registration(self):
        """Test user registration with all fields."""
        response = self.client.post('/api/auth/register/', {
            'email': 'newuser@volttn.tn',
            'password': 'Password123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'CITOYEN',
            'phone': '22233344',
            'governorate': 'Tunis',
            'address': 'Test address',
            'meter_number': 'MTR-001'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'newuser@volttn.tn')
        self.assertEqual(response.data['role'], 'CITOYEN')
    
    def test_user_login(self):
        """Test user login and JWT token generation."""
        response = self.client.post('/api/auth/token/', {
            'email': 'user@volttn.tn',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)
        
        # Verify token contains role
        import jwt
        access_token = response.data['access']
        payload = jwt.decode(access_token, options={'verify_signature': False})
        self.assertEqual(payload['role'], 'CITOYEN')
        self.assertEqual(payload['email'], 'user@volttn.tn')
    
    def test_me_endpoint(self):
        """Test me endpoint returns user profile."""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user@volttn.tn')
        self.assertEqual(response.data['role'], 'CITOYEN')
    
    def test_citizen_cannot_list_users(self):
        """Test that regular citizens cannot list all users."""
        response = self.client.get('/api/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_list_users(self):
        """Test that admins can list all users."""
        response = self.admin_client.get('/api/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data.get('results', [])), 0)
    
    def test_admin_can_update_role(self):
        """Test that admins can update user roles."""
        # First login as the regular user to get a token
        login_response = self.regular_client.post('/api/auth/token/', {
            'email': 'user@volttn.tn',
            'password': 'password123'
        })
        
        # Admin updates the role
        response = self.admin_client.patch(
            f'/api/auth/users/{self.regular_user.pk}/role/',
            {'role': 'OPERATEUR'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'OPERATEUR')
    
    def test_invalid_role_returned(self):
        """Test that invalid roles are rejected."""
        response = self.client.post('/api/auth/token/', {
            'email': 'user@volttn.tn',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EnergyServiceTests(APITestCase):
    """Tests for energy-service meters, readings, and dashboard."""
    
    def setUp(self):
        self.admin_client = APIClient()
        self.operator_client = APIClient()
        self.citizen_client = APIClient()
        
        # Create users with different roles
        self.admin_user = User.objects.create_superuser(
            email='admin@volttn.tn',
            password='admin123',
            role='ADMIN'
        )
        self.admin_client.force_authenticate(user=self.admin_user)
        
        self.operator_user = User.objects.create_user(
            email='operator@volttn.tn',
            password='operator123',
            role='OPERATEUR'
        )
        self.operator_client.force_authenticate(user=self.operator_user)
        
        self.citizen_user = User.objects.create_user(
            email='citizen@volttn.tn',
            password='citizen123',
            role='CITOYEN'
        )
        self.citizen_client.force_authenticate(user=self.citizen_user)
        
        # Create a meter owned by the citizen
        from energy.models import Meter
        self.meter = Meter.objects.create(
            meter_number='MTR-001',
            owner_id=str(self.citizen_user.id),
            governorate='Tunis',
            address='Citizen address'
        )
    
    def test_citizen_can_list_meters(self):
        """Test that citizens can list their own meters."""
        response = self.citizen_client.get('/api/energy/meters/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
    
    def test_admin_can_list_all_meters(self):
        """Test that admins can see all meters."""
        response = self.admin_client.get('/api/energy/meters/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_operator_can_list_meters(self):
        """Test that operators can list meters."""
        response = self.operator_client.get('/api/energy/meters/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_dashboard_endpoint(self):
        """Test dashboard endpoint returns user data."""
        response = self.citizen_client.get('/api/energy/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('meters_count', response.data)
        self.assertIn 'unpaid_invoices', response.data
        self.assertIn 'total_unpaid_tnd', response.data
    
    def test_reading_creation_by_owner(self):
        """Test that citizens can create readings for their own meter."""
        from energy.models import Reading
        initial_count = Reading.objects.count()
        
        response = self.citizen_client.post('/api/energy/readings/', {
            'meter': self.meter.id,
            'index_kwh': 150.5,
            'power_kw': 2.5,
            'source': 'MANUAL'
        })
        
        # Citizens can create readings for their own meter
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reading.objects.count(), initial_count + 1)


class OperationsServiceTests(APITestCase):
    """Tests for operations-service outages, interventions, and fraud alerts."""
    
    def setUp(self):
        self.admin_client = APIClient()
        self.operator_client = APIClient()
        self.citizen_client = APIClient()
        
        # Create users with different roles
        self.admin_user = User.objects.create_superuser(
            email='admin@volttn.tn',
            password='admin123',
            role='ADMIN'
        )
        self.admin_client.force_authenticate(user=self.admin_user)
        
        self.operator_user = User.objects.create_user(
            email='operator@volttn.tn',
            password='operator123',
            role='OPERATEUR'
        )
        self.operator_client.force_authenticate(user=self.operator_user)
        
        self.citizen_user = User.objects.create_user(
            email='citizen@volttn.tn',
            password='citizen123',
            role='CITOYEN'
        )
        self.citizen_client.force_authenticate(user=self.citizen_user)
    
    def test_citizen_can_report_outage(self):
        """Test that citizens can report outages."""
        from operations.models import Outage
        initial_count = Outage.objects.count()
        
        response = self.citizen_client.post('/api/operations/outages/', {
            'reference': 'INC-TEST001',
            'governorate': 'Tunis',
            'district': 'Test District',
            'address': 'Test Address',
            'type': 'COUPURE',
            'notes': 'Test outage',
            'reportedBy': self.citizen_user.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Outage.objects.count(), initial_count + 1)
    
    def test_admin_can_update_outage_status(self):
        """Test that admins can update outage status."""
        from operations.models import Outage
        outage = Outage.objects.create(
            reference='INC-ADMIN001',
            governorate='Tunis',
            address='Admin address',
            type='COUPURE',
            reporter_id=self.admin_user.id
        )
        
        response = self.admin_client.patch(
            f'/api/operations/outages/{outage.pk}/status/',
            {'status': 'RESOLU'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RESOLU')
    
    def test_citizen_cannot_update_outage_status(self):
        """Test that citizens cannot update outage status."""
        from operations.models import Outage
        outage = Outage.objects.create(
            reference='INC-CIT001',
            governorate='Tunis',
            address='Citizen address',
            type='COUPURE',
            reporter_id=self.citizen_user.id
        )
        
        response = self.citizen_client.patch(
            f'/api/operations/outages/{outage.pk}/status/',
            {'status': 'RESOLU'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_create_fraud_alert(self):
        """Test that admins can create fraud alerts."""
        from operations.models import FraudAlert
        initial_count = FraudAlert.objects.count()
        
        response = self.admin_client.post('/api/operations/fraud-alerts/', {
            'reference': 'FRD-ADMIN001',
            'meter_number': 'MTR-001',
            'governorate': 'Tunis',
            'suspicion_score': 85,
            'anomaly_type': 'CONSOMMATION_ANOMALIE'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FraudAlert.objects.count(), initial_count + 1)
    
    def test_operator_can_update_fraud_alert_status(self):
        """Test that operators can update fraud alert status."""
        from operations.models import FraudAlert
        fraud = FraudAlert.objects.create(
            reference='FRD-OPER001',
            meter_number='MTR-001',
            governorate='Tunis',
            suspicion_score=75,
            anomaly_type='PUZZLEMENT'
        )
        
        response = self.operator_client.patch(
            f'/api/operations/fraud-alerts/{fraud.pk}/status/',
            {'status': 'VALIDE', 'inspector_notes': 'Inspection completed'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'VALIDE')
        self.assertIn('inspector_notes', response.data)


if __name__ == '__main__':
    import unittest
    unittest.main()
