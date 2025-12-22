import { Routes } from '@angular/router';
import { Auth } from './components/auth/auth';
import { Tracker } from './pages/tracker/tracker';
import { Plans } from './pages/plans/plans';
import { Recipes } from './pages/recipes/recipes';
import { Shopping } from './pages/shopping/shopping';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Auth },
  { path: '', component: Tracker, canActivate: [authGuard] },
  { path: 'plans', component: Plans, canActivate: [authGuard] },
  { path: 'recipes', component: Recipes, canActivate: [authGuard] },
  { path: 'shopping', component: Shopping, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];