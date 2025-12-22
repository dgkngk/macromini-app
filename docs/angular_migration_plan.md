# Frontend Migration Plan: React to Angular

This document outlines the step-by-step strategy for migrating the Macromini frontend from React to Angular while maintaining the existing Firebase project and backend integration.

## Goal
Replace the React-based frontend with an Angular application. **No React packages** will be used in the new frontend. Deployment will remain on the same Firebase project.

---

## Phase 1: Project Initialization & Setup

1.  **Initialize Angular Workspace**
    *   Create a new directory `frontend-angular` at the project root.
    *   Initialize a new Angular app: `npx @angular/cli new macromini --directory ./frontend-angular --style css --routing true --standalone true`.

2.  **Install Essential Dependencies**
    *   **Firebase SDK:** `npm install firebase`
    *   **Icons:** `npm install lucide-angular` (Replacement for `lucide-react`)
    *   **Date Handling:** `npm install date-fns`
    *   **Animations:** `@angular/animations` (Built-in)

3.  **Configure Tailwind CSS**
    *   Install: `npm install -D tailwindcss postcss autoprefixer`
    *   Initialize: `npx tailwindcss init`
    *   Configure `content` in `tailwind.config.js` to point to Angular files.
    *   Add Tailwind directives to `src/styles.css`.

---

## Phase 2: Core Architecture & Services

4.  **Shared Logic & Models**
    *   Port `types.ts` to `src/app/models/types.ts`.
    *   Port `constants.ts` to `src/app/models/constants.ts`.

5.  **Authentication Service (`AuthService`)**
    *   Handle Firebase Auth initialization.
    *   Expose user state using Angular **Signals** or **RxJS Observables**.
    *   Implement `login()`, `logout()`, `register()`, and `loginAsGuest()`.

6.  **Data Service (`DataService`)**
    *   Centralize communication with the Express backend (`/api/...`).
    *   Implement an `HttpInterceptor` to automatically attach the Firebase ID token to requests.
    *   Provide methods for CRUD operations on Plans, Meals, Recipes, and Shopping Lists.

7.  **AI Service (`GeminiService`)**
    *   Port existing Gemini integration logic to an Angular service.

---

## Phase 3: Component Migration

8.  **Atomic/UI Components**
    *   **MacroProgress:** Convert SVG/HTML logic to an Angular component.
    *   **PlanCard:** Port input props (`@Input`) and event emitters (`@Output`).
    *   **MealLog:** List-based display component.

9.  **Feature Components**
    *   **Tracker:** Main dashboard view.
    *   **Plans:** Plan management view.
    *   **Recipes:** Cookbook and recipe generation view.
    *   **Shopping:** List management view.

10. **Modals & Overlays**
    *   Convert `ConfirmModal`, `RecipeModal`, and `SettingsModal` to Angular components.
    *   Use Angular's `*ngIf` or the `<dialog>` element for modal state management.

---

## Phase 4: Routing & Orchestration

11. **Router Configuration**
    *   Define routes for each functional tab: `/tracker`, `/plans`, `/recipes`, `/shopping`.
    *   Implement an `AuthGuard` to prevent unauthenticated access to protected routes.

12. **Main Layout (`AppComponent`)**
    *   Port the Header and Navigation logic.
    *   Use `<router-outlet>` to render the active feature.

---

## Phase 5: Build & Deployment

13. **Firebase Hosting Configuration**
    *   Modify `firebase.json` at the root.
    *   Update `hosting.public` to point to the Angular build output (e.g., `frontend-angular/dist/macromini/browser`).

14. **Deployment Workflow**
    *   Build Angular: `npm run build` (inside `frontend-angular`).
    *   Deploy: `firebase deploy --only hosting`.

---

## Success Criteria
- [ ] User can authenticate (Google/Email/Guest).
- [ ] AI meal analysis and recipe generation work as expected.
- [ ] Data persists correctly to the Firestore backend via the Express API.
- [ ] UI is visually identical to the React version (using Tailwind).
- [ ] No `node_modules` from the root React project are present in the Angular build.
