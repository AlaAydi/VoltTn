# VoltTN Backend — Django + PostgreSQL

Backend uniquement : le frontend Angular existant n'est ni inclus ni modifié. Aucun service ML.

## Architecture
- identity-service : comptes, rôles et JWT.
- energy-service : compteurs, relevés, factures, tableau de bord.
- operations-service : coupures, interventions et alertes de fraude.
- PostgreSQL + PostGIS : trois bases logiques, un conteneur de base de données.
- Nginx gateway : point d'entrée API pour Angular.

Chaque domaine Django tourne dans son propre conteneur Docker.

## Démarrage
```bash
cp .env.example .env
# Définir des secrets forts dans .env
docker compose up --build -d
docker compose ps
```
API gateway : `http://localhost:8080/api/auth/`, `/api/energy/`, `/api/operations/`.
Docs : `http://localhost:8001/api/docs/`, `8002/api/docs/`, `8003/api/docs/`.

Migrations automatiques au démarrage. Créer le premier administrateur :
```bash
docker compose exec identity python manage.py createsuperuser
```

## Authentification
`POST /api/auth/register/` crée uniquement un compte CITOYEN.
`POST /api/auth/token/` reçoit `email` et `password`, retourne `access` et `refresh`.
`POST /api/auth/token/refresh/` rafraîchit le jeton.
Les rôles disponibles sont CITOYEN, OPERATEUR, TECHNICIEN et ADMIN. Les rôles internes sont attribués par un administrateur.

## EndPoints
- Identity : `register/`, `token/`, `token/refresh/`, `me/`, `users/`, `users/<id>/role/`
- Energy : CRUD `meters/`, `readings/`, lecture `invoices/`, `dashboard/`
- Operations : CRUD `outages/`, `interventions/`, `fraud-alerts/`, action `outages/<id>/status/`

## Angular
Configurer `apiUrl: 'http://localhost:8080/api'` dans l'environnement Angular et envoyer
`Authorization: Bearer <access>` pour les requêtes authentifiées. Remplacer progressivement les services Angular qui utilisent encore des données simulées par HttpClient.

## Note
Les calculs tarifaires et les données STEG réelles doivent être validés avant une utilisation en production. Les services ne contiennent pas de modèle ML.
