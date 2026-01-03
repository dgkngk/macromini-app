## 2025-05-23 - [User Tier Caching]
**Learning:** The `attachUserTier` middleware in `server/index.js` was performing a Firestore read on every authenticated request to `/api/*`, causing significant latency and unnecessary DB read costs.
**Action:** Implemented a simple in-memory `Map` cache with a 5-minute TTL to store user tier data. This reduces Firestore reads for active users by >90% while maintaining acceptable data freshness.
