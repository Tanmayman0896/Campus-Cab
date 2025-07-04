const prisma = require('../config/database');
class VoteController {
  async vote(req, res, next) {
    try {
      const { requestId } = req.params;
      const { status, note } = req.body; // 'accepted' or 'rejected' and optional note FROM voter TO request owner
      const userId = req.user.id;

      // Find request and check if it exists and is active
      const request = await prisma.request.findUnique({
        where: { id: requestId },
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
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (request.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot vote on inactive request'
        });
      }

      if (request.userId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot vote on your own request'
        });
      }

      // Check if request is full
      if (request.currentOccupancy >= request.maxPersons) {
        return res.status(400).json({
          success: false,
          message: 'Request is already full'
        });
      }

      // Check if user already voted
      const existingVote = await prisma.vote.findUnique({
        where: {
          requestId_userId: {
            requestId,
            userId
          }
        }
      });

      let vote;
      let updatedRequest = request;

      if (existingVote) {
        // Update existing vote
        vote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { 
            status,
            note: note || null // Update note or set to null if not provided
          },
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
        });

        // If changing from accepted to rejected, decrease occupancy
        if (existingVote.status === 'accepted' && status === 'rejected') {
          updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: {
              currentOccupancy: {
                decrement: 1
              }
            }
          });
        }
        // If changing from rejected to accepted, increase occupancy
        else if (existingVote.status === 'rejected' && status === 'accepted') {
          updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: {
              currentOccupancy: {
                increment: 1
              }
            }
          });
        }
      } else {
        // Create new vote
        vote = await prisma.vote.create({
          data: {
            requestId,
            userId,
            status,
            note: note || null // Include note if provided
          },
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
        });

        // If vote is accepted, increase occupancy
        if (status === 'accepted') {
          updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: {
              currentOccupancy: {
                increment: 1
              }
            }
          });
        }
      }

      // Auto-complete request if full
      if (updatedRequest.currentOccupancy >= updatedRequest.maxPersons) {
        await prisma.request.update({
          where: { id: requestId },
          data: { status: 'completed' }
        });
      }

      res.json({
        success: true,
        message: `Vote ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`,
        data: {
          vote,
          request: {
            ...updatedRequest,
            user: request.user
          },
          // Return contact info if vote is accepted
          ...(status === 'accepted' && {
            requestOwnerContact: {
              name: request.user.name,
              email: request.user.email,
              phone: request.user.phone
            },
            voterContact: {
              name: vote.user.name,
              email: vote.user.email,
              phone: vote.user.phone
            }
          })
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get votes for user's requests (request owner can see notes from voters)
  async getRequestVotes(req, res, next) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      // Verify user owns the request
      const request = await prisma.request.findFirst({
        where: { id: requestId, userId }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or you do not have permission to view votes'
        });
      }

      const votes = await prisma.vote.findMany({
        where: { requestId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: votes
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's votes (voter can see their own votes and notes)
  async getUserVotes(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const where = { userId };
      if (status) where.status = status;

      const votes = await prisma.vote.findMany({
        where,
        include: {
          request: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: votes
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete vote
  async deleteVote(req, res, next) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const vote = await prisma.vote.findUnique({
        where: {
          requestId_userId: {
            requestId,
            userId
          }
        }
      });

      if (!vote) {
        return res.status(404).json({
          success: false,
          message: 'Vote not found'
        });
      }

      // If vote was accepted, decrease occupancy
      if (vote.status === 'accepted') {
        await prisma.request.update({
          where: { id: requestId },
          data: {
            currentOccupancy: {
              decrement: 1
            }
          }
        });
      }

      await prisma.vote.delete({
        where: { id: vote.id }
      });

      res.json({
        success: true,
        message: 'Vote deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoteController();
