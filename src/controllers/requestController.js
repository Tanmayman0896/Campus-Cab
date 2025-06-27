const prisma = require('../config/database');
const moment = require('moment');

class RequestController {
  // When a student wants to create a new ride request
  async createRequest(req, res, next) {
    try {
      const { from, to, date, time, carType, maxPersons } = req.body;
      const userId = req.user.id;

      // Create the new request with the student as the first occupant
      const newRequest = await prisma.request.create({
        data: {
          userId,
          from,
          to,
          date: new Date(date),
          time,
          carType,
          maxPersons,
          currentOccupancy: 1 // The person creating is already in
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          votes: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Your ride request has been created! Others can now find and join it.',
        data: newRequest
      });
    } catch (error) {
      next(error);
    }
  }

  // Help students find matching ride requests
  async searchRequests(req, res, next) {
    try {
      const { 
        from, 
        to, 
        date, 
        carType, 
        maxPersons, 
        page = 1, 
        limit = 10 
      } = req.query;

      const skip = (page - 1) * limit;
      const currentUserId = req.user.id;

      // Build search criteria
      const searchCriteria = {
        status: 'active',
        userId: { not: currentUserId }, // Don't show their own requests
        currentOccupancy: { lt: prisma.raw('max_persons') } // Only show if there's space
      };

      // Add filters based on what the student is looking for
      if (from) {
        searchCriteria.from = { contains: from, mode: 'insensitive' };
      }
      if (to) {
        searchCriteria.to = { contains: to, mode: 'insensitive' };
      }
      if (date) {
        const searchDate = new Date(date);
        searchCriteria.date = {
          gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          lt: new Date(searchDate.setHours(23, 59, 59, 999))
        };
      }
      if (carType && carType !== 'any') {
        searchCriteria.carType = carType;
      }
      if (maxPersons) {
        searchCriteria.maxPersons = { gte: parseInt(maxPersons) };
      }

      // Get both the matching requests and the total count
      const [matchingRequests, totalCount] = await Promise.all([
        prisma.request.findMany({
          where: searchCriteria,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            votes: {
              where: { userId: currentUserId },
              select: {
                id: true,
                status: true
              }
            }
          },
          orderBy: [
            { date: 'asc' },
            { time: 'asc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.request.count({ where: searchCriteria })
      ]);

      res.json({
        success: true,
        message: matchingRequests.length > 0 
          ? `Found ${matchingRequests.length} matching rides!` 
          : 'No matching rides found. Try adjusting your search criteria.',
        data: {
          requests: matchingRequests,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Show all available ride requests (common request page)
  async getAllRequests(req, res, next) {
    try {
      const { page = 1, limit = 20, status = 'active' } = req.query;
      const skip = (page - 1) * limit;

      const searchCriteria = {
        status,
        date: { gte: new Date() } // Only show future rides
      };

      const [allRequests, totalCount] = await Promise.all([
        prisma.request.findMany({
          where: searchCriteria,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            votes: {
              select: {
                id: true,
                userId: true,
                status: true
              }
            }
          },
          orderBy: [
            { date: 'asc' },
            { time: 'asc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.request.count({ where: searchCriteria })
      ]);

      res.json({
        success: true,
        message: allRequests.length > 0 
          ? 'Here are all the available rides' 
          : 'No rides available right now. Be the first to create one!',
        data: {
          requests: allRequests,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a student's own requests
  async getUserRequests(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const where = { userId };
      if (status) where.status = status;

      const requests = await prisma.request.findMany({
        where,
        include: {
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single request details
  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;

      const request = await prisma.request.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user's own request
  async deleteRequest(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const request = await prisma.request.findFirst({
        where: { id, userId }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or you do not have permission to delete it'
        });
      }

      await prisma.request.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      res.json({
        success: true,
        message: 'Request cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update request
  async updateRequest(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const request = await prisma.request.findFirst({
        where: { id, userId }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or you do not have permission to update it'
        });
      }

      // Convert date if provided
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const updatedRequest = await prisma.request.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          votes: true
        }
      });

      res.json({
        success: true,
        message: 'Request updated successfully',
        data: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RequestController();
