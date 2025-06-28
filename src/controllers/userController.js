const prisma = require('../config/database');

class UserController {
  // Get user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          phone: true,
          year: true,
          course: true,
          gender: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, phone, year, course, gender } = req.body;

      // Validate year if provided
      if (year !== undefined && (typeof year !== 'number' || year < 1 || year > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a number between 1 and 10'
        });
      }

      // Validate gender if provided
      if (gender !== undefined && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Gender must be male, female, or other'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(year !== undefined && { year }),
          ...(course && { course }),
          ...(gender && { gender: gender.toLowerCase() })
        },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          name: true,
          phone: true,
          year: true,
          course: true,
          gender: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics
  async getUserStats(req, res, next) {
    try {
      const userId = req.user.id;

      const [
        totalRequests,
        activeRequests,
        completedRequests,
        totalVotes,
        acceptedVotes,
        rejectedVotes
      ] = await Promise.all([
        prisma.request.count({
          where: { userId }
        }),
        prisma.request.count({
          where: { userId, status: 'active' }
        }),
        prisma.request.count({
          where: { userId, status: 'completed' }
        }),
        prisma.vote.count({
          where: { userId }
        }),
        prisma.vote.count({
          where: { userId, status: 'accepted' }
        }),
        prisma.vote.count({
          where: { userId, status: 'rejected' }
        })
      ]);

      res.json({
        success: true,
        data: {
          requests: {
            total: totalRequests,
            active: activeRequests,
            completed: completedRequests
          },
          votes: {
            total: totalVotes,
            accepted: acceptedVotes,
            rejected: rejectedVotes
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user account
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;

      // Soft delete by updating status of user's requests
      await prisma.request.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'cancelled' }
      });

      // Delete user's votes
      await prisma.vote.deleteMany({
        where: { userId }
      });

      // Delete user
      await prisma.user.delete({
        where: { id: userId }
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Filter users by criteria (admin only)
  async filterUsers(req, res, next) {
    try {
      const cleanupService = require('../services/cleanupService');
      const filters = req.query;
      
      const result = await cleanupService.filterUsers(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics (admin only)
  async getUserStatistics(req, res, next) {
    try {
      const cleanupService = require('../services/cleanupService');
      
      const stats = await cleanupService.getUserStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get incomplete user profiles (admin only)
  async getIncompleteProfiles(req, res, next) {
    try {
      const cleanupService = require('../services/cleanupService');
      
      const incompleteProfiles = await cleanupService.cleanupIncompleteUserProfiles();
      
      res.json({
        success: true,
        data: incompleteProfiles
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
