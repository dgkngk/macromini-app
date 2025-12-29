## 2025-05-23 - [PlanCard Optimization]
**Learning:** `PlanCard` components in the main tracker list were re-rendering unnecessarily on every parent state change because they lacked `React.memo` and the passed handlers were not memoized.
**Action:** Wrapped `PlanCard` in `React.memo` and wrapped `handleSelectPlan`, `openEditPlan`, `handleDeletePlan`, and `openNewPlan` in `useCallback` in `App.tsx`. Verified that this prevents prop changes when parent state (like date) updates, stabilizing the list rendering.
