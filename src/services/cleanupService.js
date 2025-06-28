const cron = require('node-cron');
const prisma = require('../config/database');
const moment = require('moment');

class CleanupService {
  constructor() {
    this.isRunning = false;
  }

  // Start the cleanup service
  start() {
    if (this.isRunning) {
      console.log('Cleanup service is already running');
      return;
    }

    const intervalHours = process.env.AUTO_CLEANUP_INTERVAL_HOURS || 1;
    
    // Run cleanup every hour
    cron.schedule(`0 */${intervalHours} * * *`, async () => {
      console.log('Running automatic cleanup...');
      await this.cleanupExpiredRequests();
    });

    this.isRunning = true;
    console.log(`Cleanup service started - running every ${intervalHours} hour(s)`);
  }

  // Stop the cleanup service
  stop() {
    cron.destroy();
    this.isRunning = false;
    console.log('Cleanup service stopped');
  }

  // Clean up expired requests and incomplete user profiles
  async cleanupExpiredRequests() {
    try {
      const expiryHours = process.env.REQUEST_EXPIRY_HOURS || 24;
      const cutoffTime = moment().subtract(expiryHours, 'hours').toDate();
      
      // Update expired active requests
      const expiredByTime = await prisma.request.updateMany({
        where: {
          status: 'active',
          OR: [
            {
              // Requests where the date has passed
              date: {
                lt: moment().startOf('day').toDate()
              }
            },
            {
              // Requests created more than X hours ago
              createdAt: {
                lt: cutoffTime
              }
            }
          ]
        },
        data: {
          status: 'expired'
        }
      });

      // Update requests that are full to completed
      const fullRequests = await prisma.request.updateMany({
        where: {
          status: 'active',
          currentOccupancy: {
            gte: prisma.raw('max_persons')
          }
        },
        data: {
          status: 'completed'
        }
      });

      // Clean up incomplete user profiles (optional)
      await this.cleanupIncompleteUserProfiles();

      console.log(`Cleanup completed: ${expiredByTime.count} expired, ${fullRequests.count} completed`);
      
      return {
        expired: expiredByTime.count,
        completed: fullRequests.count
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  // Manual cleanup (can be called via API)
  async manualCleanup() {
    console.log('Running manual cleanup...');
    return await this.cleanupExpiredRequests();
  }

  // Clean up incomplete user profiles
  async cleanupIncompleteUserProfiles() {
    try {
      // Find users with incomplete profiles (missing year, course, or gender)
      const incompleteProfiles = await prisma.user.findMany({
        where: {
          OR: [
            { year: null },
            { course: null },
            { gender: null }
          ],
          createdAt: {
            lt: moment().subtract(7, 'days').toDate() // Older than 7 days
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          year: true,
          course: true,
          gender: true
        }
      });

      console.log(`Found ${incompleteProfiles.length} incomplete user profiles`);
      return incompleteProfiles;
    } catch (error) {
      console.error('Error cleaning up incomplete user profiles:', error);
      throw error;
    }
  }

  // Get cleanup statistics
  async getCleanupStats() {
    try {
      const stats = await prisma.request.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const result = {
        active: 0,
        completed: 0,
        cancelled: 0,
        expired: 0
      };

      stats.forEach(stat => {
        result[stat.status] = stat._count.status;
      });

      return result;
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }

  // Get user statistics by year, course, and gender
  async getUserStatistics() {
    try {
      const [
        totalUsers,
        usersByYear,
        usersByCourse,
        usersByGender,
        incompleteProfiles
      ] = await Promise.all([
        // Total users
        prisma.user.count(),
        
        // Users by year
        prisma.user.groupBy({
          by: ['year'],
          _count: {
            year: true
          },
          where: {
            year: {
              not: null
            }
          }
        }),
        
        // Users by course
        prisma.user.groupBy({
          by: ['course'],
          _count: {
            course: true
          },
          where: {
            course: {
              not: null
            }
          }
        }),
        
        // Users by gender
        prisma.user.groupBy({
          by: ['gender'],
          _count: {
            gender: true
          },
          where: {
            gender: {
              not: null
            }
          }
        }),
        
        // Incomplete profiles count
        prisma.user.count({
          where: {
            OR: [
              { year: null },
              { course: null },
              { gender: null }
            ]
          }
        })
      ]);

      return {
        totalUsers,
        incompleteProfiles,
        byYear: usersByYear.reduce((acc, item) => {
          acc[item.year] = item._count.year;
          return acc;
        }, {}),
        byCourse: usersByCourse.reduce((acc, item) => {
          acc[item.course] = item._count.course;
          return acc;
        }, {}),
        byGender: usersByGender.reduce((acc, item) => {
          acc[item.gender] = item._count.gender;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Filter users by criteria
  async filterUsers(filters = {}) {
    try {
      const { year, course, gender, limit = 50, offset = 0 } = filters;
      
      const whereClause = {};
      
      if (year !== undefined) {
        whereClause.year = Number(year);
      }
      
      if (course) {
        whereClause.course = {
          contains: course,
          mode: 'insensitive'
        };
      }
      
      if (gender) {
        whereClause.gender = gender.toLowerCase();
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          year: true,
          course: true,
          gender: true,
          role: true,
          createdAt: true
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc'
        }
      });

      const totalCount = await prisma.user.count({
        where: whereClause
      });

      return {
        users,
        totalCount,
        hasMore: (offset + limit) < totalCount
      };
    } catch (error) {
      console.error('Error filtering users:', error);
      throw error;
    }
  }
}

module.exports = new CleanupService();
