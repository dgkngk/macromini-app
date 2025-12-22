import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChefHat, Moon, Sun, LogOut } from 'lucide-angular';
import { BASE_STORAGE_KEYS } from './models/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './app.html',
})
export class App {
  authService = inject(AuthService);
  
  user = this.authService.user;
  theme = signal<'light' | 'dark'>('light');
  
  icons = { ChefHat, Moon, Sun, LogOut };

  constructor() {
    const storedTheme = localStorage.getItem(BASE_STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
    if (storedTheme) this.theme.set(storedTheme);
    
    effect(() => {
      const t = this.theme();
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
      localStorage.setItem(BASE_STORAGE_KEYS.THEME, t);
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  logout() {
    this.authService.logout();
  }
}