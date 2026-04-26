const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return first error message for simplicity, or format all errors
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: extractedErrors,
    });
  }
  next();
};

module.exports = {
  handleValidationErrors
};
