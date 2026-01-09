## 2025-05-23 - [PlanCard Optimization]
**Learning:** `PlanCard` components in the main tracker list were re-rendering unnecessarily on every parent state change because they lacked `React.memo` and the passed handlers were not memoized.
**Action:** Wrapped `PlanCard` in `React.memo` and wrapped `handleSelectPlan`, `openEditPlan`, `handleDeletePlan`, and `openNewPlan` in `useCallback` in `App.tsx`. Verified that this prevents prop changes when parent state (like date) updates, stabilizing the list rendering.

## 2025-05-23 - [ShoppingList Optimization]
**Learning:** `ShoppingList` was re-rendering unnecessarily whenever `App` state changed (e.g., date selection, modal toggles) because it wasn't memoized and its handlers were recreated on every render.
**Action:** Wrapped `ShoppingList` in `React.memo` and wrapped `updateShoppingList`, `handleAddToShoppingList`, `handleAddShoppingItem`, `handleToggleShoppingItem`, `handleDeleteShoppingItem`, `handleClearCompletedShopping`, and `handleUpdateShoppingItem` in `useCallback` in `App.tsx`. This stabilizes the component so it only updates when the shopping list data actually changes.

## 2025-05-23 - [Backend User Tier Caching]
**Learning:** The `attachUserTier` middleware in the Express backend was fetching the user document from Firestore on every authenticated request, creating an N+1 read pattern and adding unnecessary latency to AI and data endpoints.
**Action:** Implemented an in-memory `Map` cache with a 60-second TTL in `server/index.js`. The cache stores user tier and subscription status, and is actively updated by webhook handlers (`subscription_updated`, etc.) to ensure immediate consistency for upgrades while drastically reducing read operations for active users.
