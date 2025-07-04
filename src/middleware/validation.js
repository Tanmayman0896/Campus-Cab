const { body, query, param } = require('express-validator');
const validateReq = [
  body('from')
    .trim()
    .notEmpty()
    .withMessage('Please tell us where you\'re starting from')
    .isLength({ min: 2, max: 100 })
    .withMessage('Starting location should be 2-100 characters'),
  
  body('to')
    .trim()
    .notEmpty()
    .withMessage('Please tell us where you\'re going')
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination should be 2-100 characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
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
    .withMessage('Time should be in HH:MM format (like 14:30)'),
  
  body('carType')
    .optional()
    .trim()
    .isIn(['sedan', 'suv', 'hatchback', 'any'])
    .withMessage('Car type should be sedan, suv, hatchback, or any'),
  
  body('maxPersons')
    .isInt({ min: 1, max: 8 })
    .withMessage('Number of people should be between 1 and 8')
];

const validateSearch = [
  query('from')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Starting location should be 2-100 characters'),
  
  query('to')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination should be 2-100 characters'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  query('carType')
    .optional()
    .trim()
    .isIn(['sedan', 'suv', 'hatchback', 'any'])
    .withMessage('Car type should be sedan, suv, hatchback, or any'),
  
  query('maxPersons')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Number of people should be between 1 and 8'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page should be a positive number'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit should be between 1 and 50')
];

const validateVote = [
  param('requestId')
    .isUUID()
    .withMessage('Invalid request ID'),
  
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Vote should be either accepted or rejected'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message should be less than 500 characters')
];
const validateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name should be 2-50 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('year')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Year should be between 1 and 10'),
  
  body('course')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course should be 2-100 characters'),
  
  body('gender')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender should be male, female, or other')
];
const validateFilter = [
  query('year')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Year should be between 1 and 10'),
  
  query('course')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Course should be 1-100 characters'),
  
  query('gender')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender should be male, female, or other'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit should be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset should be 0 or positive')
];

module.exports = {
  validateReq,
  validateSearch,
  validateVote,
  validateUser,
  validateFilter
};
