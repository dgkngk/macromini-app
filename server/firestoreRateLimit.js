import { db } from "./firebase.js";

export class FirestoreStore {
  constructor() {
    this.collection = db.collection("rate_limits");
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const docRef = this.collection.doc(key);
    const now = Date.now();

    try {
      return await db.runTransaction(async (t) => {
        const doc = await t.get(docRef);
        const data = doc.data();

        let totalHits = 1;
        let resetTime = now + this.windowMs;

        if (data && data.resetTime > now) {
          // Within window
          totalHits = (data.hits || 0) + 1;
          resetTime = data.resetTime;
          t.set(docRef, { hits: totalHits, resetTime }, { merge: true });
        } else {
          // Window expired or new
          t.set(docRef, { hits: totalHits, resetTime });
        }

        return { totalHits, resetTime: new Date(resetTime) };
      });
    } catch (e) {
      console.error("Rate limit store error", e);
      // Fail open
      return { totalHits: 1, resetTime: new Date(now + this.windowMs) };
    }
  }

  async decrement(key) {
    // Not implemented as not used by standard rate-limit flow
  }

  async resetKey(key) {
    await this.collection.doc(key).delete();
  }
}
