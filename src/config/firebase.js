const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
function initializeFirebase() {
  try {
    console.log('Initializing Firebase...');
    
    // Check if we have the required credentials
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is required in .env file');
    }

    // For development, we can skip Firebase Admin if service account is not configured
    const hasServiceAccount = process.env.FIREBASE_PRIVATE_KEY && 
                             process.env.FIREBASE_CLIENT_EMAIL &&
                             !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY') &&
                             !process.env.FIREBASE_CLIENT_EMAIL.includes('xxxxx');

    if (!hasServiceAccount) {
      console.log('Warning: Firebase Admin SDK not configured with service account.');
      console.log('For production, you need to:');
      console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('2. Generate a new private key');
      console.log('3. Update FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in .env');
      console.log('Continuing without Firebase Admin for now...');
      return Promise.resolve(null);
    }

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    console.log('Firebase Admin initialized successfully');
    return Promise.resolve(admin);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return Promise.reject(error);
  }
}

module.exports = { 
  initializeFirebase,
  admin 
};
