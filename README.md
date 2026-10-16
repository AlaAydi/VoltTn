# VoltTN — Plateforme Intelligente de Gestion de l'Électricité en Tunisie 🇹🇳⚡

> **Frontend moderne, lumineux et optimiste** inspiré de l'aube méditerranéenne sur la Tunisie.
> Développé avec **Angular 19** (Standalone Components, Signals réactifs, Control Flow `@if`/`@for`), **Three.js** pour les visualisations 3D temps réel, **Leaflet** pour la cartographie des coupures, **SCSS Glassmorphism** et support **bilingue Français / Arabe (RTL intégral)**.

---

## 1. Identité Visuelle : "Aube & Transition Énergétique" 🌅
- **Ambiance** : Lever de soleil sur la Tunisie, énergie propre, avenir optimiste (zéro thème sombre, zéro noir pur `#000000`).
- **Fond principal** : Crème chaud doux `#FFFBF2` avec dégradés aube (pêche → ciel méditerranéen).
- **Palette d'énergie** :
  - **Soleil & Énergie** : Jaune doré `#FFB703` et ambre `#FB8500`
  - **Ciel & Confiance** : Bleu ciel `#4CC9F0` et bleu océan `#2A9DF4`
  - **Nature & Espoir** : Vert frais `#52B788` et menthe `#B7E4C7`
  - **Alerte bienveillante** : Corail doux `#FF6B6B` (jamais de rouge agressif)
  - **Typographie accessible** : Bleu nuit doux `#1D3557` (contrastes WCAG AA)
- **Glassmorphism clair** : Cartes translucides `rgba(255, 255, 255, 0.85)` avec flou d'arrière-plan (`backdrop-filter: blur(16px)`), ombres douces colorées, coins arrondis généreux (`20px - 28px`) et inclinaison 3D au survol (`perspective` CSS).

---

## 2. Éléments 3D Développés avec Three.js 🎨

1. **Hero 3D de la Page d'Accueil** (`app-hero-3d`) :
   - Soleil doré lumineux en arrière-plan avec halo doux
   - 3 éoliennes tunisiennes avec pales en rotation continue
   - Champs de panneaux photovoltaïques inclinés à 30°
   - Petite ville stylisée *low-poly* aux teintes pastel et fenêtres lumineuses
   - Légère parallaxe interactive selon les mouvements de la souris

2. **Carte 3D Interactive de la Tunisie (Espace Opérateur)** (`app-tunisia-map-3d`) :
   - Extrusion 3D géoréférencée des **24 gouvernorats tunisiens**
   - Hauteur et couleur de chaque colonne selon la charge électrique en MW :
     - 🟢 **Vert (#52B788)** : Charge nominale (< 75%)
     - 🟡 **Jaune (#FFB703)** : Charge élevée (75% - 90%)
     - 🔴 **Corail (#FF6B6B)** : Risque de surcharge (> 90%)
   - Détection de survol par **Raycasting Three.js** avec infobulle interactive (charge, capacité, température, libellés en français et arabe)
   - Rotation automatique douce commutable, contrôles caméra orbite à la souris et zoom molette

3. **Compteur Intelligent 3D (Espace Citoyen)** (`app-meter-3d`) :
   - Compteur électrique connecté STEG en 3D
   - Anneau néon dynamique et aiguille animée réagissant en direct aux fluctuations de puissance instantanée en kW
   - Particules d'énergie flottantes et reflet verre
   - Fallback automatique 2D sécurisé si WebGL est désactivé

---

## 3. Comptes de Test & Authentification par Rôle 🔐

L'accès aux espaces se fait par **authentification stricte avec guards de routage (`authGuard` et `roleGuard`)**. Dès la connexion ou l'inscription, l'utilisateur est automatiquement redirigé vers le tableau de bord correspondant à son rôle :

| Rôle | Nom & Profil | Email | Mot de Passe | Dashboard Dédié |
| :--- | :--- | :--- | :--- | :--- |
| **CITOYEN** | Yassine Ben Salem *(Menzah 6, Tunis)* | `citoyen@volttn.tn` | `citoyen123` | `/citoyen/dashboard` |
| **OPERATEUR** | Ing. Leila Mansour *(Dispatching STEG)* | `operateur@volttn.tn` | `operateur123` | `/operateur/dashboard` |
| **TECHNICIEN** | Karim Trabelsi *(District Ben Arous)* | `technicien@volttn.tn` | `technicien123` | `/technicien/interventions` |
| **ADMIN** | Dr. Amine Bouazizi *(Direction SI)* | `admin@volttn.tn` | `admin123` | `/admin/users` |

> 💡 **Astuce Démo** : Sur la page `/login`, des boutons de pré-remplissage en 1 clic permettent de renseigner instantanément les identifiants de test pour chaque rôle.

---

## 4. Structure de l'Architecture Frontend 📂

```text
src/
├── app/
│   ├── core/                        # Cœur technique (services, guards, i18n)
│   │   ├── guards/
│   │   │   └── auth.guard.ts        # authGuard & roleGuard fonctionnels
│   │   └── services/
│   │       ├── auth.service.ts      # Gestion session, rôles, inscription, mot de passe
│   │       ├── electricity.service.ts # 24 gouvernorats, métriques réseau, prévision IA, scénarios
│   │       ├── citizen.service.ts   # Compteur 3D, historique 12 mois, facture estimée, conseils éco
│   │       ├── fraud.service.ts     # 50 cas de fraude avec facteurs d'explication SHAP
│   │       ├── outage.service.ts    # 30 pannes réelles géolocalisées, signalements, résolution
│   │       ├── solar.service.ts     # Simulateur solaire tunisien, irradiation, prime ANME Prosol
│   │       ├── admin.service.ts     # Gestion 20 utilisateurs, modèles ML, seuils, générateur démo
│   │       ├── notification.service.ts # Notifications réactives & toasts chaleureux
│   │       └── i18n.service.ts      # Support bilingue FR/AR (Signals réactifs & RTL natif)
│   ├── models/                      # Interfaces TypeScript strictes
│   │   ├── user.model.ts
│   │   ├── governorate.model.ts
│   │   ├── consumption.model.ts
│   │   ├── fraud.model.ts
│   │   ├── outage.model.ts
│   │   ├── solar.model.ts
│   │   ├── ml-model.model.ts
│   │   └── notification.model.ts
│   ├── shared/                      # Composants réutilisables & directives 3D
│   │   ├── components/
│   │   │   ├── navbar/              # Barre supérieure avec profil et toggle FR/AR
│   │   │   ├── sidebar/             # Sidebar glassmorphism réductible par rôle
│   │   │   ├── toast/               # Toasts flottants animés
│   │   │   ├── hero-3d/             # Scène 3D d'accueil Three.js
│   │   │   ├── tunisia-map-3d/      # Carte 3D 24 gouvernorats Three.js
│   │   │   └── meter-3d/            # Compteur connecté 3D Three.js
│   │   ├── directives/
│   │   │   └── tilt-3d.directive.ts # Effet 3D tilt perspective sur les cartes
│   │   └── pipes/
│   │       └── translate.pipe.ts    # Pipe de traduction réactif
│   ├── features/                    # Modules métiers découpés par domaine
│   │   ├── public/                  # Pages publiques (Accueil, Login, Inscription, Pannes, Solaire)
│   │   ├── citoyen/                 # Espace Citoyen (Dashboard 3D, Consommation, Signalement, Astuces)
│   │   ├── operateur/               # Espace Opérateur (Console Réseau, Prévision IA, SHAP Fraude, Stats)
│   │   ├── technicien/              # Espace Technicien (Ordres de mission, Workflow de clôture)
│   │   └── admin/                   # Espace Admin (Gestion comptes, Modèles ML, Seuils, Démo 1-clic)
│   ├── app.routes.ts                # Lazy loading et protections CanActivate
│   ├── app.component.ts             # Shell principal avec sidebar conditionnelle
│   └── styles.scss                  # Design Tokens SCSS, glassmorphism, animations et RTL
```

---

## 5. Démarrage Rapide 🚀

### Prérequis
- **Node.js** v18+ ou v20+ (recommandé v22)
- **npm** v10+

### Installation & Lancement
```bash
# 1. Cloner ou ouvrir le dossier du projet
cd projetAvancé

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement local
npm start
# ou: ng serve
```

L'application est disponible sur : **`http://localhost:4200`**

### Vérification du Build Production
```bash
npm run build
```
Le build est optimisé avec **0 avertissement et 0 erreur de compilation**.

---

## 6. Guide de Connexion avec un Backend Spring Boot 🍃

Tous les services frontend (`ElectricityService`, `CitizenService`, `FraudService`, `OutageService`, `SolarService`, `AdminService`, `AuthService`) sont conçus selon le pattern d'isolation des données :

### Exemple : Remplacement du Mock dans `ElectricityService`
Dans `src/app/core/services/electricity.service.ts` :

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export class ElectricityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/grid`;

  // Remplacer le signal mock par l'appel Spring Boot
  loadGovernorates(): Observable<Governorate[]> {
    return this.http.get<Governorate[]>(`${this.apiUrl}/governorates`);
  }

  getForecast(governorateId?: string, horizon: string = 'J+1'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/forecast`, {
      params: { governorateId: governorateId || '', horizon }
    });
  }
}
```

### Endpoints REST Spring Boot Recommandés :
- `POST /api/auth/login` & `POST /api/auth/register` (JWT tokens)
- `GET /api/grid/governorates` (24 gouvernorats tunisiens avec charge SCADA)
- `GET /api/grid/forecast?horizon=J+1` (Sortie du modèle LightGBM / Python FastAPI)
- `GET /api/fraud/alerts` (Alertes avec scores et coefficients SHAP)
- `POST /api/outages/report` & `PUT /api/outages/{id}/status` (Workflow interventions)
- `POST /api/solar/simulate` (Calculateur irradiation ANME)

---

## 7. Fonctionnalités Clés par Espace 🌟

### 👤 Espace Citoyen
- **Compteur 3D vivant** : Aiguille et anneau néon réactifs selon la puissance consommée en direct.
- **Suivi énergétique** : Graphiques 12 mois mettant en évidence le **pic estival tunisien (juillet-août)** causé par la climatisation.
- **Simulateur Solaire ANME Prosol** : Sliders de toiture en m², orientation et calcul automatique du retour sur investissement (ROI en ~4 ans).
- **Signalement de panne** : Formulaire avec gouvernorat, adresse précise, nature de la panne et photo optionnelle.
- **Astuces Éco-gestes** : Recommandations adaptées aux habitudes tunisiennes (climatiseur à 26°C, heures creuses après 22h).

### 🖥️ Espace Opérateur STEG
- **Carte 3D de la Tunisie** : Extrusion polygonale des 24 gouvernorats avec code couleur temps réel (Vert/Jaune/Corail) et infobulle au survol.
- **Courbe de prévision IA** : Modèle LightGBM v2.4 (réel vs prédit avec bande de confiance à 95%, métriques MAE 18.4 MW, RMSE 24.1 MW, MAPE 2.12%).
- **Simulateur de Scénarios en Direct** : Sliders de canicule (+5°C), jour férié et activité industrielle modifiant instantanément la charge nationale.
- **Détection de Fraude SHAP** : 50 cas filtrables avec décomposition des valeurs SHAP (chute brutale, consommation nocturne, etc.) et boutons Valider / Rejeter / Inspecter.
- **Export de Données** : Boutons opérationnels de téléchargement Excel (CSV), JSON et aperçu d'impression PDF.

### 🛠️ Espace Technicien
- **Missions de terrain assignées** : Tri par urgence et statut.
- **Workflow de clôture** : Passage de `Signalé` à `En cours` puis `Résolu` avec saisie du rapport technique de rétablissement du courant.

### ⚙️ Espace Administrateur
- **Gestion des 20 utilisateurs** : Recherche en temps réel, modification de rôle et blocage/déblocage.
- **Seuils d'alerte configurables** : Curseurs par gouvernorat pour définir les limites de surcharge.
- **Registre des Modèles ML** : Comparaison des versions (LightGBM v2.4, XGBoost, LSTM) et simulation de réentraînement.
- **Journal d'Audit** : Traçabilité horodatée de chaque action opérateur.
- **Générateur Démo 1-Clic** : Déclenchez instantanément une simulation de canicule (+6°C), une alerte tempête au Nord, ou réinitialisez l'état nominal pour vos présentations.
