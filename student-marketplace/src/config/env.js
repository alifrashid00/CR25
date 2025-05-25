// Environment configuration validation
export const validateEnvConfig = () => {
    const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars.join(', '));
        console.error('Please check your .env file and ensure all required variables are set.');
        throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
};

// Configuration object with fallbacks
export const config = {
    firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    },
    groq: {
        apiKey: import.meta.env.VITE_GROQ_API_KEY || null
    },
    university: {
        domains: import.meta.env.VITE_UNIVERSITY_DOMAINS?.split(',') || []
    }
};

// Validate configuration on import
validateEnvConfig();
