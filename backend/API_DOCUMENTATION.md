# VoltTN Backend — API Documentation

## Table of Contents
- [Identity Service](#identity-service-api)
- [Energy Service](#energy-service-api)
- [Operations Service](#operations-service-api)
- [Gateway](#gateway-routing)
- [Authentication](#authentication)
- [Error Responses](#error-responses)

---

## Identity Service API

**Base Path**: `http://localhost:8080/api/auth/` (via gateway)  
**Service Port**: 8001  
**Authentication**: JWT Bearer tokens

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `register/` | POST | No | `{ "email": "string", "password": "string (min 10 chars)", "first_name": "string", "last_name": "string", "role": "CITOYEN|OPERATEUR|TECHNICIEN|ADMIN", "phone": "string (optional)", "governorate": "string (optional)", "address": "string (optional)", "meter_number": "string (optional)" }` | `{ "success": bool, "user": UserSerializer, "message": "string" }` | Register a new citizen user. Role defaults to CITOYEN. |
| `token/` | POST | No | `{ "email": "string", "password": "string" }` | `{ "success": bool, "user": UserSerializer, "access": "string (JWT)", "refresh": "string (JWT refresh token)" }` | Obtain JWT access and refresh tokens via email/password. |
| `token/refresh/` | POST | No | `{ "refresh": "string" }` | `{ "access": "string (new JWT)" }` | Refresh access token using refresh token. |
| `me/` | GET | Yes (Bearer) | None | `{ "user": UserSerializer }` | Get current authenticated user's profile. |
| `users/` | GET | Yes (ADMIN) | None | `{ "count": int, "results": [UserSerializer] }` | List all users. Admin-only endpoint. |
| `users/{pk}/role/` | PATCH | Yes (ADMIN) | `{ "role": "CITOYEN|OPERATEUR|TECHNICIEN|ADMIN" }` | `{ "user": UserSerializer }` | Update a user's role. Admin-only endpoint. Validates role against User.Role.values. |

### User Model (UserSerializer fields)
`id`, `email`, `first_name`, `last_name`, `role`, `phone`, `governorate`, `address`, `meter_number`, `status`, `created_at`
- `id`: read-only
- `role`: read-only for non-admin users
- `status`: read-only
- `created_at`: read-only

---

## Energy Service API

**Base Path**: `http://localhost:8080/api/energy/` (via gateway)  
**Service Port**: 8002  
**Authentication**: JWT Bearer tokens

### Meters

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `meters/` | GET | Yes | Query params: `role`, `governorate` | `{ "count": int, "next": "string or null", "previous": "string or null", "results": [MeterSerializer] }` | List meters. Filtered by user role. Admins see all; operators/techniciens see only their assigned meters. |
| `meters/` | POST | Yes (ADMIN/OPERATEUR) | `{ "owner_id": "string", "meter_number": "string (unique)", "client_code": "string (optional)", "governorate": "string", "address": "string", "status": "ACTIF|INACTIF (optional)" }` | `{ "meter": MeterSerializer }` | Create a new meter. Admins can set owner_id; operators can assign to any user. |
| `meters/{id}/` | GET | Yes | None | `{ "meter": MeterSerializer }` | Retrieve meter details. |
| `meters/{id}/` | PUT | Yes | Same as POST | `{ "meter": MeterSerializer }` | Full update of meter. |
| `meters/{id}/` | DELETE | Yes (ADMIN) | None | `{ "detail": "string" }` | Delete meter. Admin-only. Uses PROTECT if invoices reference it. |

### Readings

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `readings/` | GET | Yes | Query params: `meter_id`, `date_gte`, `date_lte` | Paginated list of readings | List readings. Filtered by user role. Citizens can only read their own meter's readings. |
| `readings/` | POST | Yes | `{ "meter": "int (Meter ID)", "index_kwh": "decimal", "power_kw": "decimal (optional)", "source": "MANUAL|OCR_PHOTO|TELERELEVE|CONTROLEUR" }` | `{ "reading": ReadingSerializer }` | Create a new reading. Citizens can only create readings for their own meter; operators/techniciens can create for any meter. Validates that citizen's meter_id matches their user ID. |
| `readings/{id}/` | GET | Yes | None | `{ "reading": ReadingSerializer }` | Retrieve reading details. |

### Invoices

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `invoices/` | GET | Yes | None | `{ "count": int, "results": [InvoiceSerializer] }` | List invoices. Filtered by user role. Citizens see only their own invoices. |
| `invoices/{id}/` | GET | Yes | None | `{ "invoice": InvoiceSerializer }` | Retrieve invoice details. Read-only access. |

### Dashboard

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `dashboard/` | GET | Yes | None | `{ "meters_count": int, "latest_readings": [...], "unpaid_invoices": [...], "total_unpaid_tnd": "decimal" }` | Get dashboard summary for the authenticated user. Includes meter count, recent readings, unpaid invoices total. |

---

## Operations Service API

**Base Path**: `http://localhost:8080/api/operations/` (via gateway)  
**Service Port**: 8003  
**Authentication**: JWT Bearer tokens

### Outages

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `outages/` | GET | Yes | Query params: `governorate`, `status`, `severity` | Paginated list of outages | List outages. Filtered by user role. Citizens see only their own outages (reporter_id = user_id). |
| `outages/` | POST | Yes | `{ "reference": "string (unique)", "governorate": "string", "district": "string (optional)", "address": "string", "type": "string", "notes": "string (optional)", "reportedBy": "string (optional)" }` | `{ "outage": OutageSerializer }` | Create a new outage report. Automatically generates reference as `INC-YYYYMMDDHHMMSSffffff`. Sets `reporter_id` to current user's ID. |
| `outages/{id}/` | GET | Yes | None | `{ "outage": OutageSerializer }` | Retrieve outage details. |
| `outages/{id}/status/` | PATCH | Yes (ADMIN/OPERATEUR/TECHNICIEN) | `{ "status": "SIGNALE|EN_COURS|RESOLU" }` | `{ "outage": OutageSerializer }` | Update outage status. Only staff roles (ADMIN/OPERATEUR/TECHNICIEN) can update status. Sets `resolved_at` when status is RESOLU. |

### Interventions

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `interventions/` | GET | Yes | Query params: `technician_id`, `status` | Paginated list of interventions | List interventions. Filtered by role. Technicians see only their own interventions; Citizens see none; Operateurs/ADMIN see all. |
| `interventions/` | POST | Yes (ADMIN/OPERATEUR) | `{ "outage": "int (Outage ID)", "technician_id": "string (optional)", "title": "string", "description": "string (optional)" }` | `{ "intervention": InterventionSerializer }` | Create a new intervention. Validates that user is admin or operateur. |
| `interventions/{id}/` | GET | Yes | None | `{ "intervention": InterventionSerializer }` | Retrieve intervention details. |

### Fraud Alerts

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `fraud-alerts/` | GET | Yes (ADMIN/OPERATEUR) | None | Paginated list of fraud alerts | List fraud alerts. Admins and operateurs can view; citizens cannot. |
| `fraud-alerts/` | POST | Yes (ADMIN/OPERATEUR) | `{ "reference": "string (unique)", "meter_number": "string", "customer_reference": "string (optional)", "governorate": "string", "suspicion_score": "integer (0-100)", "anomaly_type": "string", "estimated_loss_tnd": "decimal (optional, default 0)" }` | `{ "fraud_alert": FraudAlertSerializer }` | Create a new fraud alert. Validates that user is admin or operateur. Automatically generates reference as `FRD-YYYYMMDDHHMMSSffffff`. |
| `fraud-alerts/{id}/status/` | PATCH | Yes (ADMIN/OPERATEUR) | `{ "status": "NOUVEAU|EN_INSPECTION|VALIDE|REJETE", "inspector_notes": "string (optional)" }` | `{ "fraud_alert": FraudAlertSerializer }` | Update fraud alert status. Only admin/operateur can update. Preserves existing inspector_notes if not provided. |

---

## Gateway Routing

The Nginx gateway (port 8080) routes requests to the appropriate Django services:

| URL Pattern | Target Service | Target Port | Notes |
|-------------|----------------|-------------|-------|
| `/api/auth/` | identity-service | 8001 | Authentication and user management |
| `/api/energy/` | energy-service | 8002 | Meters, readings, invoices, dashboard |
| `/api/operations/` | operations-service | 8003 | Outages, interventions, fraud alerts |
| `/api/` (root) | — | — | Redirects to API documentation |
| `/health/` | — | — | Gateway health check |

### Nginx Configuration (gateway/nginx.conf)
```nginx
events { worker_connections 1024; }
http {
    upstream identity { server identity:8001; }
    upstream energy { server energy:8002; }
    upstream operations { server operations:8003; }
    
    server {
        listen 80;
        server_name localhost;
        
        location /api/auth/ {
            proxy_pass http://identity/api/auth/;
        }
        
        location /api/energy/ {
            proxy_pass http://energy/api/energy/;
        }
        
        location /api/operations/ {
            proxy_pass http://operations/api/operations/;
        }
    }
}
```

---

## Authentication

### JWT Authentication

- **Scheme**: Bearer token in `Authorization` header
- **Header format**: `Authorization: Bearer <access_token>`
- **Token type**: Access token (short-lived) and Refresh token (long-lived)
- **Signing key**: `JWT_SIGNING_KEY` environment variable (or `DJANGO_SECRET_KEY` fallback)
- **Algorithm**: HS256

### Token Payload

The JWT token includes the following claims:
- `user_id`: The user's primary key (integer or string)
- `role`: The user's role (CITOYEN, OPERATEUR, TECHNICIEN, ADMIN)

### Authentication Class

`shared.authentication.SharedJWTAuthentication` - Validates the Bearer token and attaches the `TokenUser` object to the request. The `TokenUser` has attributes: `id`, `pk`, `role`, `is_staff`, `is_superuser` (is_staff and is_superuser are True only if role is ADMIN).

### Login / Logout

| Action | Endpoint | Method | Body | Response |
|--------|----------|--------|------|----------|
| Login | `/api/auth/token/` | POST | `{ "email": "string", "password": "string" }` | `{ "access": "JWT", "refresh": "JWT refresh" }` |
| Logout | — | — | — | Invalidates refresh token on client side |

### Role-Based Access Control

- **Default permission**: `IsAuthenticated` for all endpoints (except register/token)
- **Admin-only**: `IsAdminUser` for user management, role updates
- **Staff-only**: ADMIN, OPERATEUR, TECHNICIEN for outage status updates, fraud alert management
- **Citizen-specific**: Can only access data associated with their own meter/user ID

### CORS Configuration

- `CORS_ALLOWED_ORIGINS`: `http://localhost:4200,http://127.0.0.1:4200` (Angular dev server)
- Production should specify actual frontend domain
- Configured in each service's `settings.py` via `CORS_ALLOWED_ORIGINS` env var

---

## Error Responses

### Standard Error Format

All error responses follow a consistent structure:

```json
{
  "detail": "Error description message"
}
```

### Common HTTP Status Codes

| Status Code | Meaning | When |
|-------------|---------|------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST/PUT request |
| 400 | Bad Request | Invalid input data, validation errors, invalid role value |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate entry (unique constraint violation) |
| 422 | Unprocessable Entity | Data validation failed |
| 500 | Internal Server Error | Unexpected server error |

### Specific Error Cases

| Endpoint | Error Scenario | Status Code | Response |
|----------|----------------|-------------|----------|
| `/register/` | Email already registered | 400 | `{ "detail": "Un compte existe déjà avec cette adresse email." }` |
| `/token/` | Invalid credentials | 400 | `{ "detail": "Mot de passe incorrect." }` |
| `/token/` | Account blocked | 400 | `{ "detail": "Votre compte a été suspendu par un administrateur STEG." }` |
| `/meters/` | Citizen tries another's meter | 403 | `{ "detail": "Accès non autorisé à ce compteur." }` |
| `/outages/` | Citizen creates outage for another area | 403 | `{ "detail": "Seuls les administrateurs peuvent effectuer cette action." }` |
| `/outages/{id}/status/` | Non-staff tries to update status | 403 | `{ "detail": "Vous n'avez pas la permission de modifier le statut." }` |
| `/fraud-alerts/{id}/status/` | Non-staff tries to update status | 403 | `{ "detail": "Vous n'avez pas la permission de modifier le statut." }` |
| `/meters/{id}/` | Invalid meter ID | 404 | `{ "detail": "Compteur introuvable." }` |
| `/outages/{id}/` | Invalid outage ID | 404 | `{ "detail": "Panne introuvable." }` |

### Validation Errors

When request data fails validation, the response includes error details:

```json
{
  "detail": {
    "field_name": ["Error message for this field."]
  }
}
```

or

```json
{
  "detail": "Descriptive error message"
}
```

depending on the view implementation.

---

## API Error Code Summary

| Code | Meaning |
|------|---------|
| 400 | Bad request - invalid input data |
| 401 | Unauthorized - missing/invalid token |
| 403 | Forbidden - insufficient permissions |
| 404 | Not found - resource doesn't exist |
| 409 | Conflict - duplicate entry |
| 422 | Unprocessable entity - validation failed |

---

*Document generated from analysis of VoltTN frontend requirements and existing backend services.*