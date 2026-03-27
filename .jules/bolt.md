## 2025-05-23 - [AddMeal Optimization]
**Learning:** `AddMeal` was re-rendering whenever parent state (e.g. `App.tsx` toggles) changed, even if its props (`remainingMacros`, `currentPlan`) were stable.
**Action:** Wrapped `AddMeal` in `React.memo` to stabilize it. This is particularly useful as it contains a text input which we want to keep responsive.
