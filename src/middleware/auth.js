const { admin } = require('../config/firebase');
const db = require('../config/database');
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Please log in first'
      });
    }

    const token = authHeader.substring(7);
    
    // If Firebase Admin isn't set up, use mock user for development
    if (!admin) {
      console.log('Warning: Using mock user - Firebase Admin not configured');
      req.user = {
        id: 'dev-user-123',
        firebaseUid: 'dev-firebase-uid',
        email: 'dev@example.com',
        name: 'Dev User',
        phone: '1234567890',
        role: 'student'
      };
      return next();
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find user in database
    let user = await db.user.findUnique({
      where: { firebaseUid: decodedToken.uid }
    });

    // Create user if they don't exist
    if (!user) {
      user = await db.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split('@')[0],
          phone: decodedToken.phone_number || '',
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid login token'
    });
  }
};

module.exports = { auth };
