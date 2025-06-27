const { body, query, param } = require('express-validator');

const createRequestValidation = [
  body('from')
    .trim()
    .notEmpty()
    .withMessage('From location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('From location must be between 2 and 100 characters'),
  
  body('to')
    .trim()
    .notEmpty()
    .withMessage('To location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('To location must be between 2 and 100 characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
  
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  
  body('carType')
    .optional()
    .trim()
    .isIn(['sedan', 'suv', 'hatchback', 'any'])
    .withMessage('Car type must be sedan, suv, hatchback, or any'),
  
  body('maxPersons')
    .isInt({ min: 1, max: 8 })
    .withMessage('Max persons must be between 1 and 8')
];

const searchRequestsValidation = [
  query('from')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('From location must be between 2 and 100 characters'),
  
  query('to')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('To location must be between 2 and 100 characters'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  
  query('carType')
    .optional()
    .trim()
    .isIn(['sedan', 'suv', 'hatchback', 'any'])
    .withMessage('Car type must be sedan, suv, hatchback, or any'),
  
  query('maxPersons')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Max persons must be between 1 and 8'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const voteValidation = [
  param('requestId')
    .isUUID()
    .withMessage('Request ID must be a valid UUID'),
  
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Vote status must be either accepted or rejected')
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Phone number must be valid')
];

module.exports = {
  createRequestValidation,
  searchRequestsValidation,
  voteValidation,
  updateUserValidation
};
