const prisma = require('../config/database');

class UserController {
  // Get current user's profile information
  async getProfile(req, res, next) {
    try {
      const currentUserId = req.user.id;

      const userProfile = await prisma.user.findUnique({
        where: { id: currentUserId },
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

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found. Please contact support if this issue persists.'
        });
      }

      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      next(error);
    }
  }

  // Update current user's profile information
  async updateProfile(req, res, next) {
    try {
      const currentUserId = req.user.id;
      const { name, phone, year, course, gender } = req.body;

      // Validate academic year if provided
      if (year !== undefined && (typeof year !== 'number' || year < 1 || year > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Academic year must be a number between 1 and 10.'
        });
      }

      const updatedProfile = await prisma.user.update({
        where: { id: currentUserId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(year && { year }),
          ...(course && { course }),
          ...(gender && { gender })
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
        message: 'Your profile has been updated successfully!',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user activity statistics
  async getUserStats(req, res, next) {
    try {
      const currentUserId = req.user.id;

      // Fetch all statistics in parallel for better performance
      const [
        totalRequestsCreated,
        activeRequestsCount,
        completedRequestsCount,
        totalVotesCast,
        acceptedVotesCount,
        rejectedVotesCount
      ] = await Promise.all([
        // Count all ride requests created by user
        prisma.request.count({
          where: { userId: currentUserId }
        }),
        // Count active ride requests
        prisma.request.count({
          where: { userId: currentUserId, status: 'active' }
        }),
        // Count completed ride requests
        prisma.request.count({
          where: { userId: currentUserId, status: 'completed' }
        }),
        // Count all votes cast by user
        prisma.vote.count({
          where: { userId: currentUserId }
        }),
        // Count accepted votes
        prisma.vote.count({
          where: { userId: currentUserId, status: 'accepted' }
        }),
        // Count rejected votes
        prisma.vote.count({
          where: { userId: currentUserId, status: 'rejected' }
        })
      ]);

      const userStats = {
        requests: {
          total: totalRequestsCreated,
          active: activeRequestsCount,
          completed: completedRequestsCount
        },
        votes: {
          total: totalVotesCast,
          accepted: acceptedVotesCount,
          rejected: rejectedVotesCount,
          pending: totalVotesCast - acceptedVotesCount - rejectedVotesCount
        }
      };

      res.json({
        success: true,
        data: userStats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all users (admin only)
  async getAllUsers(req, res, next) {
    try {
      const currentUser = req.user;
      
      // Check if user has admin privileges
      if (currentUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required to view all users.'
        });
      }

      const { page = 1, limit = 20 } = req.query;
      const skipCount = (page - 1) * limit;

      const [allUsers, totalUsersCount] = await Promise.all([
        prisma.user.findMany({
          skip: skipCount,
          take: parseInt(limit),
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
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
      ]);

      const totalPages = Math.ceil(totalUsersCount / limit);

      res.json({
        success: true,
        data: {
          users: allUsers,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers: totalUsersCount,
            usersPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res, next) {
    try {
      const currentUser = req.user;
      const targetUserId = req.params.id;

      // Check if user has admin privileges
      if (currentUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required to delete users.'
        });
      }

      // Prevent admin from deleting themselves
      if (currentUser.id === targetUserId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account through this endpoint.'
        });
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found. They may have already been deleted.'
        });
      }

      // Delete user and all related data
      await prisma.user.delete({
        where: { id: targetUserId }
      });

      res.json({
        success: true,
        message: `User ${targetUser.name || targetUser.email} has been deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
