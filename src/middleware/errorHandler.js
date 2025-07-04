const { validationResult } = require('express-validator');
const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please fix the following errors:',
      errors: errors.array()
    });
  }
  
  next();
};
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Database errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'This already exists'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Could not find what you\'re looking for'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Something went wrong'
  });
};

module.exports = { handleErrors, errorHandler };
