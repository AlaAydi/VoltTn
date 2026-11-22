# VoltTN Backend — Analysis Report

## 1. Existing Architecture

The VoltTN backend uses a **microservices architecture** with four Django-based services, PostgreSQL (via PostGIS), and Redis (planned). Each service runs in its own Docker container with dedicated database and port.

### Services Overview

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| **identity-service** | 8001 | volttn_identity | Authentication, authorization, user management, JWT token generation |
| **energy-service** | 8002 | volttn_energy | Meters, readings, invoices, dashboard, consumption data |
| **operations-service** | 8003 | volttn_operations | Outages, interventions, fraud alerts, grid incidents |
| **gateway** | 8080 (nginx) | — | API routing, reverse proxy for Angular frontend |

### Database Architecture

- **PostgreSQL** with PostGIS extension (shared container, 3 logical databases)
- `volttn_identity` — User accounts, roles, authentication data
- `volttn_energy` — Meters, readings, invoices, consumption statistics
- `volttn_operations` — Outages, interventions, fraud alerts

Each service connects to its own database name on the `postgres` host via port 5432.

### API Gateway Configuration

- Nginx reverse proxy on port 8080
- Routes `/api/auth/` → identity-service (port 8001)
- Routes `/api/energy/` → energy-service (port 8002)
- Routes `/api/operations/` → operations-service (port 8003)
- Forwarded from host port 8080 to nginx port 80

### Authentication

- JWT-based authentication using `drf-simplejwt`
- Shared authentication class: `shared.authentication.SharedJWTAuthentication`
- Token types: Access token, Refresh token
- Roles: CITOYEN, OPERATEUR, TECHNICIEN, ADMIN
- All API endpoints require authentication (except register and token endpoints)
- Role-based access control via DRF permission classes

## 2. Frontend Functionality Inventory

The Angular frontend (version 19) communicates with the backend via HTTP requests. Below is the complete mapping of frontend features to backend API requirements.

### Authentication Flow

| Feature | Angular Service | HTTP Method | Endpoint | Request Body | Response |
|---------|----------------|-------------|----------|--------------|----------|
| User registration | auth.service.ts | POST | `/api/auth/register/` | {email, password, first_name, last_name, role, phone, governorate, address, meter_number} | {success, user, message} |
| User login | auth.service.ts | POST | `/api/auth/token/` | {email, password} | {success, user, access, refresh} |
| Token refresh | auth.service.ts | POST | `/api/auth/token/refresh/` | {refresh} | {access token} |
| Get current user | citizenship/dashboard | GET | `/api/auth/me/` | — | {user profile} |
| Logout | auth.service.ts | — | — | — | — |

### Citizen Dashboard & Consumption

| Feature | Angular Service | HTTP Method | Endpoint | Request Body | Response |
|---------|----------------|-------------|----------|--------------|----------|
| Get consumption data | citizen.service.js | GET | `/api/energy/meters/` | — | List of meters (filtered by role) |
| Get meter detail | — | GET | `/api/energy/meters/{id}/` | — | Meter details |
| Create reading (OCR) | smart-billing.service.js | POST | `/api/energy/readings/` | {meter, index_kwh, power_kw, source} | Reading object |
| Get readings list | — | GET | `/api/energy/readings/` | — | List of readings |
| Dashboard data | citoyen/dashboard | GET | `/api/energy/dashboard/` | — | {meters_count, latest_readings, unpaid_invoices, total_unpaid_tnd} |
| Report outage | report-outage.service.js | POST | `/api/operations/outages/` | {governorate, district, address, type, notes, reportedBy} | {reference, id, ...} |
| Get tips | citizen.service.js | GET | `/api/energy/tips/` (conceptual) | — | Energy savings tips |
| Smart billing OCR | smart-billing.service.js | POST | `/api/energy/readings/` (submit) | {indexKwh, source} | {costTnd, status} |
| Billing explorer (tabs) | smart-billing.service.js | GET | `/api/energy/invoices/` | — | List of invoices |

### Operator Dashboard

| Feature | Angular Service | HTTP Method | Endpoint | Request Body | Response |
|---------|----------------|-------------|----------|--------------|----------|
| View outages | fraud.component.js | GET | `/api/operations/outages/` | — | List of outages (filtered by role) |
| Update outage status | fraud.component.js | PATCH | `/api/operations/outages/{id}/status/` | {status: "SIGNALE"|"EN_COURS"|"RESOLU"} | Updated outage |
| View interventions | — | GET | `/api/operations/interventions/` | — | List of interventions |
| Create intervention | — | POST | `/api/operations/interventions/` | {outage, technician_id, title, description} | Intervention object |
| View fraud alerts | fraud.component.js | GET | `/api/operations/fraud-alerts/` | — | List of fraud alerts |
| Update fraud alert status | fraud.component.js | PATCH | `/api/operations/fraud-alerts/{id}/status/` | {status: "NOUVEAU"|"EN_INSPECTION"|"VALIDE"|"REJETE"}, {inspector_notes} | Updated fraud alert |
| View governorates | electricity.service.js | GET | — | — | Predefined Tunisian governorates |
| Get forecast | electricity.service.js | GET | conceptual | — | Load forecast data (partly simulated) |

### Technician Interventions

| Feature | Angular Service | HTTP Method | Endpoint | Request Body | Response |
|---------|----------------|-------------|----------|--------------|----------|
| View own interventions | technicien/interventions | GET | `/api/operations/interventions/` | — | Interventions assigned to technician |
| Update intervention status | — | PATCH | conceptual | — | Intervention status update |

### Admin Dashboard

| Feature | Angular Service | HTTP Method | Endpoint | Request Body | Response |
|---------|----------------|-------------|----------|--------------|----------|
| List users | admin.service.js | GET | `/api/auth/users/` | — | List of users (admin only) |
| Change user role | admin.service.js | PATCH | `/api/auth/users/{id}/role/` | {role: "CITOYEN"|"OPERATEUR"|"TECHNICIEN"|"ADMIN"} | Updated user |
| Toggle user status | admin.service.js | — | conceptual | — | User status toggle |
| Update thresholds | admin.service.js | — | conceptual | — | Governorship threshold update |
| Activate ML model | admin.service.js | — | conceptual | — | Model activation |
| Generate demo data | admin.service.js | — | conceptual | — | Demo data generation |

### Public Pages

| Feature | Angular Service | HTTP Method | Endpoint | Request Body | Response |
|---------|----------------|-------------|----------|--------------|----------|
| Home page | public/home | GET | — | — | Static page |
| Login page | public/login | POST | `/api/auth/token/` | {email, password} | {token, user} |
| Register page | public/register | POST | `/api/auth/register/` | {user data} | {success, user} |
| Solar simulator | public/solar-simulator | GET | conceptual | — | Solar simulation results |

## 3. Existing API Inventory

### Identity Service (`/api/auth/`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/register/` | POST | Register new citizen user | No |
| `/token/` | POST | Obtain JWT token (email/password) | No |
| `/token/refresh/` | POST | Refresh access token | No |
| `/me/` | GET | Get current user profile | Yes |
| `/users/` | GET | List all users | Yes (admin) |
| `/users/{id}/role/` | PATCH | Update user role | Yes (admin) |

### Energy Service (`/api/energy/`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/meters/` | GET | List meters (filtered by role) | Yes |
| `/meters/` | POST | Create new meter | Yes (admin/operateur) |
| `/meters/{id}/` | GET | Retrieve meter details | Yes |
| `/meters/{id}/` | PUT | Update meter | Yes |
| `/meters/{id}/` | DELETE | Delete meter | Yes (admin) |
| `/readings/` | GET | List readings (filtered by role) | Yes |
| `/readings/` | POST | Create new reading | Yes |
| `/readings/{id}/` | GET | Retrieve reading details | Yes |
| `/invoices/` | GET | List invoices (filtered by role) | Yes |
| `/dashboard/` | GET | Dashboard data summary | Yes |

### Operations Service (`/api/operations/`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/outages/` | GET | List outages (filtered by role) | Yes |
| `/outages/` | POST | Create new outage report | Yes |
| `/outages/{id}/` | GET | Retrieve outage details | Yes |
| `/outages/{id}/status/` | PATCH | Update outage status | Yes (admin/operateur) |
| `/interventions/` | GET | List interventions (filtered by role) | Yes |
| `/interventions/` | POST | Create new intervention | Yes (admin/operateur) |
| `/interventions/{id}/` | GET | Retrieve intervention details | Yes |
| `/fraud-alerts/` | GET | List fraud alerts (filtered by role) | Yes |
| `/fraud-alerts/` | POST | Create new fraud alert | Yes (admin/operateur) |
| `/fraud-alerts/{id}/status/` | PATCH | Update fraud alert status | Yes (admin/operateur) |

## 4. Missing API Endpoints

Based on the frontend-to-backend functionality map, the following endpoints are either missing or incomplete:

### Identity Service
- `GET /api/auth/me/` — Frontend expects to get current user profile; not explicitly verified in backend
- `GET /api/auth/users/` — List users endpoint exists but needs verification
- `PATCH /api/auth/users/{id}/role/` — Role update endpoint exists but needs verification

### Energy Service
- `POST /api/energy/readings/` — Frontend smart-billing OCR submission needs this endpoint; verified in views.py but needs validation
- `GET /api/energy/dashboard/` — Dashboard endpoint exists and is functional
- Meter creation permission logic needs verification for citoyen users

### Operations Service
- Outage creation via `/api/operations/outages/` — Frontend reports outages but the API integration needs verification
- Fraud alert creation via `/api/operations/fraud-alerts/` — Needs verification
- Intervention creation via `/api/operations/interventions/` — Needs verification

### Gateway
- Nginx routing configuration needs verification for correct service forwarding
- CORS configuration needs alignment with Angular frontend origin

## 5. Database Model Requirements

### Identity Service (User model)

- **User** extends AbstractUser
  - `email` (EmailField, unique=True) — AUTH_USER_EMAIL_FIELD
  - `role` (CharField, max_length=20, choices) — CITOYEN/OPERATEUR/TECHNICIEN/ADMIN, default=CITOYEN
  - `phone` (CharField, max_length=30, blank=True)
  - `governorate` (CharField, max_length=80, blank=True)
  - `address` (CharField, max_length=255, blank=True)
  - `meter_number` (CharField, max_length=50, blank=True)
  - `status` (CharField, max_length=20, default="ACTIF")
  - `created_at` (DateTimeField, auto_now_add=True)
  - `USERNAME_FIELD = "email"` — Email-based authentication
  - `REQUIRED_FIELDS = []` — No required fields beyond email

- **RelatedName fixes**: `groups` and `user_permissions` ManyToMany fields with `related_name` to avoid clashes with Django auth

### Energy Service Models

- **Meter**
  - `owner_id` (CharField, max_length=64, db_index=True)
  - `meter_number` (CharField, max_length=50, unique=True)
  - `client_code` (CharField, max_length=50, blank=True)
  - `governorate` (CharField, max_length=80)
  - `address` (CharField, max_length=255)
  - `status` (CharField, max_length=20, default="ACTIF")
  - `installed_at` (DateField, null=True, blank=True)
  - `created_at` (DateTimeField, auto_now_add=True)

- **Reading**
  - `meter` (ForeignKey to Meter, on_delete=CASCADE, related_name="readings")
  - `recorded_at` (DateTimeField, db_index=True)
  - `index_kwh` (DecimalField, max_digits=12, decimal_places=3)
  - `power_kw` (DecimalField, max_digits=8, decimal_places=3, null=True, blank=True)
  - `source` (CharField, max_length=30, default="MANUAL")
  - `created_at` (DateTimeField, auto_now_add=True)

- **Invoice**
  - `owner_id` (CharField, max_length=64, db_index=True)
  - `meter` (ForeignKey to Meter, on_delete=PROTECT, related_name="invoices")
  - `reference` (CharField, max_length=50, unique=True)
  - `period_start` (DateField)
  - `period_end` (DateField)
  - `consumption_kwh` (DecimalField, max_digits=12, decimal_places=3)
  - `amount_tnd` (DecimalField, max_digits=12, decimal_places=3)
  - `due_date` (DateField)
  - `status` (CharField, max_length=20, default="IMPAYEE")
  - `created_at` (DateTimeField, auto_now_add=True)

### Operations Service Models

- **Outage**
  - `reference` (CharField, max_length=50, unique=True)
  - `reporter_id` (CharField, max_length=64, db_index=True)
  - `governorate` (CharField, max_length=80)
  - `district` (CharField, max_length=100, blank=True)
  - `address` (CharField, max_length=255)
  - `latitude` (DecimalField, max_digits=9, decimal_places=6, null=True, blank=True)
  - `longitude` (DecimalField, max_digits=9, decimal_places=6, null=True, blank=True)
  - `outage_type` (CharField, max_length=40)
  - `status` (CharField, max_length=20, default="SIGNALE")
  - `severity` (CharField, max_length=20, default="MOYENNE")
  - `affected_customers` (PositiveIntegerField, default=0)
  - `assigned_technician_id` (CharField, max_length=64, blank=True)
  - `notes` (TextField, blank=True)
  - `reported_at` (DateTimeField, auto_now_add=True)
  - `resolved_at` (DateTimeField, null=True, blank=True)

- **Intervention**
  - `outage` (ForeignKey to Outage, on_delete=SET_NULL, null=True, blank=True, related_name="interventions")
  - `technician_id` (CharField, max_length=64, db_index=True)
  - `title` (CharField, max_length=160)
  - `description` (TextField, blank=True)
  - `scheduled_at` (DateTimeField, null=True, blank=True)
  - `completed_at` (DateTimeField, null=True, blank=True)
  - `status` (CharField, max_length=20, default="PLANIFIEE")
  - `created_at` (DateTimeField, auto_now_add=True)

- **FraudAlert**
  - `reference` (CharField, max_length=50, unique=True)
  - `meter_number` (CharField, max_length=50)
  - `customer_reference` (CharField, max_length=100, blank=True)
  - `governorate` (CharField, max_length=80)
  - `suspicion_score` (PositiveSmallIntegerField)
  - `anomaly_type` (CharField, max_length=180)
  - `estimated_loss_tnd` (DecimalField, max_digits=12, decimal_places=3, default=0)
  - `status` (CharField, max_length=20, default="NOUVEAU")
  - `inspector_notes` (TextField, blank=True)
  - `detected_at` (DateTimeField, auto_now_add=True)

## 6. Problems Discovered

### 6.1 Authentication & Authorization

1. **SharedJWTAuthentication role default**: The `SharedJWTAuthentication` class defaults role to "CITOYEN" if not present in the token. This could lead to incorrect role assignment for users with other roles.

2. **Role validation incomplete**: The `RoleView` in identity-service validates role values against `User.Role.values`, but the `VoltTokenSerializer` adds `role` and `email` to the JWT token without validation that the role is valid.

3. **Password validation**: The `RegisterSerializer` requires `min_length=10` for password, but the `UserCreationForm` and Django's default password validators are not fully configured.

### 6.2 Model & Relationship Issues

1. **RelatedName clashes**: The User model inheriting from AbstractUser causes `fields.E304` errors for `groups` and `user_permissions` reverse accessors clashing with Django's default auth.User. This was fixed by adding explicit `related_name` attributes.

2. **GDAL/PostGIS configuration**: Django settings use `django.contrib.gis.db.backends.postgis` but the GDAL library is not available on the host system. The Docker Compose uses `postgis/postgis:16-3.4` image which has GDAL pre-installed. Local development requires either GDAL installation or switching to non-GIS PostgreSQL backend.

3. **Admin configuration**: The identity-service `UserAdmin` configuration conflicts with Django's internal admin validation. Fixed by removing the custom User admin registration.

4. **Missing database migrations**: No migrations have been run yet. The `docker-entrypoint-initdb.d` directory contains `01-databases.sql` which creates the three databases, but no Django migration files exist for the service models.

### 6.3 API Integration Gaps

1. **`/api/auth/me/` endpoint**: Frontend `AuthService` and various components expect to retrieve the current user profile via this endpoint, but its existence and implementation need verification.

2. **Reading creation via OCR**: The SmartBillingComponent's `submitReading()` method creates local `MeterReading` objects but doesn't persist them to the backend via `/api/energy/readings/`.

3. **Outage tracking integration**: The `ReportOutageComponent` sends outage data via `outageService.reportOutage()`, but the backend integration and database persistence flow needs verification.

4. **Invoice read-only access**: The `InvoiceViewSet` uses `ReadOnlyModelViewSet`, but the frontend smart-billing component may need limited update capabilities.

### 6.4 Docker & Infrastructure

1. **Environment files**: No `.env` files exist in the service directories. The `docker-compose.yml` references `.env` via `env_file`, but default values in settings.py may be used.

2. **Database initialization**: The `01-databases.sql` file creates databases but Django migrations haven't been generated or applied.

3. **Redis not configured**: The infrastructure doesn't include Redis, though the mission requires Redis for caching.

### 6.5 Code Quality Issues

1. **Hardcoded values**: Several views have hardcoded business logic (e.g., `STAFF` sets, tariff calculations in frontend).

2. **Incomplete permission logic**: Some viewsets have permission logic that depends on `request.user.role`, which relies on the JWT token containing the `role` claim.

3. **N+1 query potential**: Some queryset operations don't use `select_related` or `prefetch_optimally`.

## 7. Proposed Corrections

### 7.1 Authentication Corrections

1. Fix `SharedJWTAuthentication` to properly extract and validate the role from JWT tokens.
2. Ensure all role-based checks use consistent validation.
3. Add password strength validation matching the `min_length=10` requirement.

### 7.2 Model Corrections

1. Keep the `related_name` fixes for `groups` and `user_permissions` in the User model.
2. Add `db_index=True` where appropriate for frequently filtered fields.
3. Add `unique_together` or `unique_constraints` where business logic requires it.

### 7.3 API Endpoint Additions

1. Implement `GET /api/auth/me/` to return current user profile.
2. Ensure `POST /api/energy/readings/` properly validates and persists reading data.
3. Verify and fix outage/intervention/fraud alert creation endpoints.
4. Add missing dashboard and summary endpoints.

### 7.4 Database & Migration Management

1. Run `python manage.py makemigrations` for all services.
2. Run `python manage.py migrate` to create database tables.
3. Create a migration execution strategy in Docker Compose (automatic at startup).

### 7.5 Redis Implementation

1. Add Redis service to `docker-compose.yml`.
2. Configure Django caching with Redis backend.
3. Add Redis for session storage or API response caching.
4. Set appropriate expiration policies.

### 7.6 Docker Corrections

1. Create `.env` files with proper secrets.
2. Ensure all Django services have valid Dockerfiles.
3. Add health checks for all services.
4. Configure persistent volumes for databases.
5. Set up correct internal networking using service names.

## 8. Testing Strategy

### 8.1 Unit Tests

- Test User model creation and validation.
- Test serializer validation (register, login, reading creation).
- Test viewset permissions and filter logic.
- Test JWT token generation and validation.
- Test permission classes (role-based access control).

### 8.2 API Tests

For each important endpoint:
- Successful request with valid data.
- Invalid input (missing required fields, wrong formats).
- Missing required fields validation.
- Unauthorized request (no token, invalid token).
- Forbidden request (valid token but wrong role).
- Nonexistent resource (invalid ID).
- Database persistence verification.
- Correct response structure.

### 8.3 Integration Tests

- Gateway routing to correct services.
- Django services and PostgreSQL connectivity.
- Django services and Redis connectivity (once implemented).
- End-to-end business workflows (registration → login → protected resource access).

### 8.4 Docker Tests

- `docker compose up --build -d` starts all containers.
- All services remain healthy.
- Database migrations execute successfully on startup.
- Gateway routes correctly to all three services.

## 9. Migration Management

- All Django services use `makemigrations` and `migrate` commands.
- Docker Compose runs `makemigrations` and `migrate --noinput` on startup.
- Migration files should be version-controlled.
- No automatic squashing; manual migration management.

---

*End of Analysis Report*