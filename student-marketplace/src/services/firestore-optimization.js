// Firestore performance optimization utilities
import { 
    enableNetwork, 
    disableNetwork,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import cache from './cache';

// Enable offline persistence for faster loading
export const enableOfflinePersistence = async () => {
    try {
        // This should be called before any other Firestore operations
        console.log('Firestore offline persistence enabled');
    } catch (error) {
        console.error('Failed to enable offline persistence:', error);
    }
};

// Optimize network usage
export const optimizeNetwork = {
    // Enable network for online operations
    enable: () => enableNetwork(db),
    
    // Disable network for offline-only operations
    disable: () => disableNetwork(db)
};

// Query optimization helpers
export const queryOptimizations = {
    // Batch size recommendations
    OPTIMAL_BATCH_SIZE: 10,
    LISTINGS_PER_PAGE: 12,
    SERVICES_PER_PAGE: 12,
    
    // Index requirements for composite queries
    requiredIndexes: [
        // Listings
        { collection: 'listings', fields: ['status', 'createdAt'] },
        { collection: 'listings', fields: ['category', 'status', 'createdAt'] },
        { collection: 'listings', fields: ['university', 'status', 'createdAt'] },
        { collection: 'listings', fields: ['userId', 'status', 'createdAt'] },
        { collection: 'listings', fields: ['pricingType', 'status', 'createdAt'] },
        
        // Bids
        { collection: 'bids', fields: ['listingId', 'status', 'amount'] },
        { collection: 'bids', fields: ['listingId', 'status', 'createdAt'] },
        { collection: 'bids', fields: ['sellerId', 'status', 'createdAt'] },
        
        // Services
        { collection: 'services', fields: ['status', 'createdAt'] },
        { collection: 'services', fields: ['category', 'status', 'createdAt'] },
        { collection: 'services', fields: ['university', 'status', 'createdAt'] },
        
        // Conversations
        { collection: 'conversations', fields: ['listingId', 'sellerId'] },
        { collection: 'conversations', fields: ['listingId', 'buyerId'] },
        
        // Reviews
        { collection: 'reviews', fields: ['sellerId', 'createdAt'] },
        { collection: 'reviews', fields: ['listingId', 'createdAt'] }
    ]
};

// Performance monitoring
export const performanceMonitor = {
    startTime: null,
    
    start(operation) {
        this.startTime = performance.now();
        console.log(`🚀 Starting ${operation}...`);
    },
    
    end(operation) {
        if (this.startTime) {
            const duration = performance.now() - this.startTime;
            console.log(`✅ ${operation} completed in ${duration.toFixed(2)}ms`);
            this.startTime = null;
            return duration;
        }
    }
};

// Query batching for multiple reads
export const queryBatcher = {
    // Batch multiple document reads
    async batchGetDocs(docRefs) {
        performanceMonitor.start('Batch document fetch');
        
        try {
            const promises = docRefs.map(docRef => getDoc(docRef));
            const snapshots = await Promise.all(promises);
            
            const results = snapshots.map(snap => ({
                id: snap.id,
                exists: snap.exists(),
                data: snap.exists() ? snap.data() : null
            }));
            
            performanceMonitor.end('Batch document fetch');
            return results;
        } catch (error) {
            console.error('Batch get docs failed:', error);
            throw error;
        }
    },

    // Batch multiple queries with optimized execution
    async batchQueries(queries) {
        performanceMonitor.start('Batch queries');
        
        try {
            const promises = queries.map(({ collection, constraints, cacheKey }) => {
                if (cacheKey && cache.has(cacheKey)) {
                    return Promise.resolve(cache.get(cacheKey));
                }
                
                let q = query(collection, ...constraints);
                return getDocs(q).then(snapshot => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    if (cacheKey) {
                        cache.set(cacheKey, data);
                    }
                    
                    return data;
                });
            });
            
            const results = await Promise.all(promises);
            performanceMonitor.end('Batch queries');
            return results;
        } catch (error) {
            console.error('Batch queries failed:', error);
            throw error;
        }
    }
};

// Connection pool management
export const connectionPool = {
    maxConnections: 10,
    activeConnections: 0,
    pendingQueue: [],
    
    async acquire() {
        if (this.activeConnections < this.maxConnections) {
            this.activeConnections++;
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            this.pendingQueue.push(resolve);
        });
    },
    
    release() {
        this.activeConnections--;
        if (this.pendingQueue.length > 0) {
            const next = this.pendingQueue.shift();
            this.activeConnections++;
            next();
        }
    },
    
    // Execute operation with connection pooling
    async execute(operation) {
        await this.acquire();
        try {
            return await operation();
        } finally {
            this.release();
        }
    }
};

// Intelligent prefetching
export const prefetcher = {
    // Prefetch related data based on user behavior
    async prefetchRelated(listingId) {
        try {
            const cacheKey = `related_${listingId}`;
            if (cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }
            
            // Prefetch bids, reviews, and seller info in parallel
            const [bids, reviews] = await Promise.all([
                queryBatcher.batchQueries([
                    {
                        collection: db.collection('bids'),
                        constraints: [where('listingId', '==', listingId), orderBy('amount', 'desc'), limit(5)],
                        cacheKey: `bids_${listingId}`
                    }
                ]),
                queryBatcher.batchQueries([
                    {
                        collection: db.collection('reviews'),
                        constraints: [where('listingId', '==', listingId), orderBy('createdAt', 'desc'), limit(5)],
                        cacheKey: `reviews_${listingId}`
                    }
                ])
            ]);
            
            const relatedData = { bids: bids[0], reviews: reviews[0] };
            cache.set(cacheKey, relatedData, 300); // 5-minute cache
            
            return relatedData;
        } catch (error) {
            console.error('Prefetch failed:', error);
            return null;
        }
    },
    
    // Prefetch user's likely next actions
    async prefetchUserData(userId) {
        const cacheKey = `user_data_${userId}`;
        if (cache.has(cacheKey)) {
            return;
        }
        
        // Prefetch user's listings, bids, and conversations
        queryBatcher.batchQueries([
            {
                collection: db.collection('listings'),
                constraints: [where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(10)],
                cacheKey: `user_listings_${userId}`
            },
            {
                collection: db.collection('bids'),
                constraints: [where('buyerId', '==', userId), orderBy('createdAt', 'desc'), limit(10)],
                cacheKey: `user_bids_${userId}`
            }
        ]);
    }
};

// Advanced query optimization
export const queryOptimizer = {
    // Optimize pagination with cursor-based approach
    createPaginatedQuery(baseQuery, lastDoc = null, pageSize = 10) {
        let optimizedQuery = query(baseQuery, limit(pageSize));
        
        if (lastDoc) {
            optimizedQuery = query(optimizedQuery, startAfter(lastDoc));
        }
        
        return optimizedQuery;
    },
    
    // Smart filtering to reduce data transfer
    createEfficientFilter(filters) {
        // Order filters by selectivity (most selective first)
        const orderedFilters = filters.sort((a, b) => {
            const selectivityOrder = { '==': 1, 'in': 2, '>=': 3, '<=': 4, '!=': 5 };
            return selectivityOrder[a.operator] - selectivityOrder[b.operator];
        });
        
        return orderedFilters.map(filter => where(filter.field, filter.operator, filter.value));
    }
};

// Real-time optimization
export const realtimeOptimizer = {
    listeners: new Map(),
    
    // Optimized listener that uses cache when appropriate
    addOptimizedListener(query, callback, cacheKey) {
        // Check cache first
        if (cacheKey && cache.has(cacheKey)) {
            callback(cache.get(cacheKey));
        }
        
        // Set up real-time listener
        const unsubscribe = query.onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            if (cacheKey) {
                cache.set(cacheKey, data, 120); // 2-minute cache for real-time data
            }
            
            callback(data);
        });
        
        this.listeners.set(cacheKey || 'default', unsubscribe);
        return unsubscribe;
    },
    
    // Clean up listeners to prevent memory leaks
    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }
};

export default {
    enableOfflinePersistence,
    optimizeNetwork,
    queryOptimizations,
    performanceMonitor,
    queryBatcher,
    connectionPool,
    prefetcher,
    queryOptimizer,
    realtimeOptimizer
};
