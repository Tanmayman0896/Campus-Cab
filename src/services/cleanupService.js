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

  // Clean up expired requests
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
}

module.exports = new CleanupService();
