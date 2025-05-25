// Cache service for improved performance
class CacheService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = 1000; // Maximum number of cached items
        this.hitCount = 0;
        this.missCount = 0;
    }

    set(key, value, ttl = this.defaultTTL) {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.delete(oldestKey);
        }

        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    get(key) {
        const expiry = this.cacheExpiry.get(key);
        if (!expiry || Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            this.missCount++;
            return null;
        }
        this.hitCount++;
        
        // Move to end for LRU
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        
        return value;
    }

    delete(key) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
    }

    clear() {
        this.cache.clear();
        this.cacheExpiry.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    has(key) {
        const expiry = this.cacheExpiry.get(key);
        if (!expiry || Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            return false;
        }
        return this.cache.has(key);
    }

    // Get cache statistics
    getStats() {
        const total = this.hitCount + this.missCount;
        return {
            hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) : 0,
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hits: this.hitCount,
            misses: this.missCount
        };
    }

    // Prefetch data for faster access
    async prefetch(key, fetchFunction, ttl = this.defaultTTL) {
        if (!this.has(key)) {
            try {
                const data = await fetchFunction();
                this.set(key, data, ttl);
                return data;
            } catch (error) {
                console.error('Prefetch failed for key:', key, error);
                throw error;
            }
        }
        return this.get(key);
    }

    // Batch set multiple items
    setBatch(items, ttl = this.defaultTTL) {
        items.forEach(({ key, value }) => {
            this.set(key, value, ttl);
        });
    }

    // Invalidate by pattern
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
    }
}

export const cache = new CacheService();
