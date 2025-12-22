import { Injectable, signal, WritableSignal } from '@angular/core';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../models/types';

const GUEST_SESSION_KEY = 'macromini_guest_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: WritableSignal<User | null> = signal<User | null>(null);
  loading: WritableSignal<boolean> = signal<boolean>(true);

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    const guestSession = localStorage.getItem(GUEST_SESSION_KEY);
    if (guestSession) {
      this.user.set(JSON.parse(guestSession));
    }

    onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        localStorage.removeItem(GUEST_SESSION_KEY);
        this.user.set(this.mapFirebaseUser(fbUser));
      } else {
        const currentGuest = localStorage.getItem(GUEST_SESSION_KEY);
        if (currentGuest) {
          this.user.set(JSON.parse(currentGuest));
        } else {
          this.user.set(null);
        }
      }
      this.loading.set(false);
    });
  }

  private mapFirebaseUser(fbUser: FirebaseUser): User {
    return {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.email || 'U')}&background=random`
    };
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.removeItem(GUEST_SESSION_KEY);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    localStorage.removeItem(GUEST_SESSION_KEY);
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    localStorage.removeItem(GUEST_SESSION_KEY);
  }

  async loginAsGuest(): Promise<void> {
    const guestUser: User = {
      id: 'guest_user_v1',
      email: '',
      name: 'Guest Chef',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff&background=6366f1'
    };
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestUser));
    this.user.set(guestUser);
  }

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem(GUEST_SESSION_KEY);
    this.user.set(null);
  }
  
  async getIdToken(): Promise<string | null> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }
}
