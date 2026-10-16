import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models/user.model';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) {
      return router.createUrlTree(['/login']);
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // Si le rôle ne correspond pas, rediriger vers son espace dédié
    auth.redirectByRole(user.role);
    return false;
  };
};
