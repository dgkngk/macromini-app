import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LucideAngularModule, ChefHat, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './auth.html',
})
export class Auth {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLogin = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly icons = { ChefHat, Mail, Lock, User, ArrowRight, Loader2 };

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    name: ['']
  });

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set(null);
    this.form.reset();
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password, name } = this.form.value;

    try {
      if (this.isLogin()) {
        await this.authService.login(email!, password!);
      } else {
        if (!name) {
          this.error.set('Name is required');
          this.loading.set(false);
          return;
        }
        await this.authService.register(email!, password!, name!);
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'Authentication failed');
    } finally {
      this.loading.set(false);
    }
  }

  async handleGoogleLogin() {
    this.loading.set(true);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async handleGuestLogin() {
    this.loading.set(true);
    try {
      await this.authService.loginAsGuest();
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}