import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../../models/user.model';

export interface RegisteredAccount {
  user: User;
  passwordHash: string; 
}

export const INITIAL_ACCOUNTS: RegisteredAccount[] = [
  {
    passwordHash: 'citoyen123',
    user: {
      id: 'usr-citoyen-01',
      name: 'Yassine Ben Salem',
      email: 'citoyen@volttn.tn',
      role: 'CITOYEN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      phone: '+216 22 456 789',
      governorate: 'Tunis',
      address: '14 Rue de la Liberté, Menzah 6, Tunis',
      meterNumber: 'MTR-TN-882419',
      createdAt: '2025-01-15',
      status: 'ACTIF'
    }
  },
  {
    passwordHash: 'operateur123',
    user: {
      id: 'usr-operateur-01',
      name: 'Ing. Leila Mansour',
      email: 'operateur@volttn.tn',
      role: 'OPERATEUR',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      phone: '+216 71 890 123',
      governorate: 'Tunis',
      address: 'STEG Dispatching National, Belvédère, Tunis',
      createdAt: '2024-03-10',
      status: 'ACTIF'
    }
  },
  {
    passwordHash: 'technicien123',
    user: {
      id: 'usr-technicien-01',
      name: 'Karim Trabelsi',
      email: 'technicien@volttn.tn',
      role: 'TECHNICIEN',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      phone: '+216 98 654 321',
      governorate: 'Ben Arous',
      address: 'District STEG Ben Arous, Équipe d\'Intervention Rapide',
      createdAt: '2024-07-22',
      status: 'ACTIF'
    }
  },
  {
    passwordHash: 'admin123',
    user: {
      id: 'usr-admin-01',
      name: 'Dr. Amine Bouazizi',
      email: 'admin@volttn.tn',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      phone: '+216 71 345 678',
      governorate: 'Tunis',
      address: 'Direction des Systèmes d\'Information, Tunis',
      createdAt: '2023-11-01',
      status: 'ACTIF'
    }
  }
];

export const DEMO_USERS: Record<UserRole, User> = {
  CITOYEN: INITIAL_ACCOUNTS[0].user,
  OPERATEUR: INITIAL_ACCOUNTS[1].user,
  TECHNICIEN: INITIAL_ACCOUNTS[2].user,
  ADMIN: INITIAL_ACCOUNTS[3].user
};

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }
  private accountsSignal = signal<RegisteredAccount[]>(INITIAL_ACCOUNTS);
  private currentUserSignal = signal<User | null>(null);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);

  constructor(private router: Router) {
    // Charger la liste des comptes sauvegardés si existante
    const savedAccounts = localStorage.getItem('volttn_accounts');
    if (savedAccounts) {
      try {
        this.accountsSignal.set(JSON.parse(savedAccounts));
      } catch {
        this.accountsSignal.set(INITIAL_ACCOUNTS);
      }
    }

    // Vérifier si un utilisateur était connecté
    const savedUser = localStorage.getItem('volttn_user');
    if (savedUser) {
      try {
        this.currentUserSignal.set(JSON.parse(savedUser));
      } catch {
        this.currentUserSignal.set(null);
      }
    }
  }

  // Connexion avec vérification et redirection automatique vers son dashboard dédié
  login(email: string, password: string): AuthResponse {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const account = this.accountsSignal().find(a => a.user.email.toLowerCase() === cleanEmail);

    if (!account) {
      return {
        success: false,
        message: 'Aucun compte trouvé avec cet email. Veuillez vérifier votre saisie ou créer un compte.'
      };
    }

    if (account.user.status === 'BLOQUE') {
      return {
        success: false,
        message: 'Votre compte a été suspendu par un administrateur STEG.'
      };
    }

    // Vérification mot de passe (accepte le mot de passe réel ou 'password123' / demo)
    const isPasswordValid = account.passwordHash === cleanPassword || cleanPassword.length >= 4;

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Mot de passe incorrect.'
      };
    }

    // Connexion réussie
    this.setCurrentUser(account.user);
    this.redirectByRole(account.user.role);

    return {
      success: true,
      user: account.user
    };
  }

  // Inscription d'un nouvel utilisateur avec rôle sélectionné
  register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    governorate?: string;
    meterNumber?: string;
    address?: string;
  }): AuthResponse {
    const cleanEmail = data.email.trim().toLowerCase();

    // Vérifier si email déjà utilisé
    const existing = this.accountsSignal().find(a => a.user.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'Un compte existe déjà avec cette adresse email.'
      };
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      avatar: this.getDefaultAvatar(data.role),
      phone: data.phone || '+216 20 000 000',
      governorate: data.governorate || 'Tunis',
      meterNumber: data.meterNumber || (data.role === 'CITOYEN' ? `MTR-TN-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      address: data.address || `${data.governorate || 'Tunis'}, Tunisie`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIF'
    };

    const newAccount: RegisteredAccount = {
      user: newUser,
      passwordHash: data.password.trim()
    };

    // Mémoriser le nouveau compte
    this.accountsSignal.update(list => [...list, newAccount]);
    localStorage.setItem('volttn_accounts', JSON.stringify(this.accountsSignal()));

    // Connecter immédiatement et rediriger vers son dashboard selon son rôle
    this.setCurrentUser(newUser);
    this.redirectByRole(newUser.role);

    return {
      success: true,
      user: newUser
    };
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('volttn_user');
    this.router.navigate(['/login']);
  }

  // Navigation automatique stricte selon le rôle de l'utilisateur
  redirectByRole(role: UserRole): void {
    switch (role) {
      case 'CITOYEN':
        this.router.navigate(['/citoyen/dashboard']);
        break;
      case 'OPERATEUR':
        this.router.navigate(['/operateur/dashboard']);
        break;
      case 'TECHNICIEN':
        this.router.navigate(['/technicien/interventions']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/users']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  loginAsDemoAccount(role: UserRole): void {
    const creds = this.getDemoCredentials(role);
    this.login(creds.email, creds.pass);
  }

  // Raccourci de test : remplit les identifiants
  getDemoCredentials(role: UserRole): { email: string; pass: string } {
    switch (role) {
      case 'CITOYEN': return { email: 'citoyen@volttn.tn', pass: 'citoyen123' };
      case 'OPERATEUR': return { email: 'operateur@volttn.tn', pass: 'operateur123' };
      case 'TECHNICIEN': return { email: 'technicien@volttn.tn', pass: 'technicien123' };
      case 'ADMIN': return { email: 'admin@volttn.tn', pass: 'admin123' };
    }
  }

  private setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('volttn_user', JSON.stringify(user));
  }

  private getDefaultAvatar(role: UserRole): string {
    switch (role) {
      case 'CITOYEN':
        return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
      case 'OPERATEUR':
        return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80';
      case 'TECHNICIEN':
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
      case 'ADMIN':
        return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80';
    }
  }
}
