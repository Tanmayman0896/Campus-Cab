const { admin } = require('../config/firebase');
const prisma = require('../config/database');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7);
    
    // Check if Firebase Admin is configured
    if (!admin) {
      // For development without Firebase Admin, create a mock user
      console.log('Warning: Using mock authentication - Firebase Admin not configured');
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
    
    // Get user from database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid }
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
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
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateUser };
