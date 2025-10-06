import { body, param, query } from 'express-validator';

export const createCustomerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),

  body('identityCard')
    .optional()
    .trim()
    .isLength({ min: 9, max: 12 })
    .withMessage('Identity card must be between 9 and 12 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Identity card must contain only numbers'),

  body('status')
    .optional()
    .isIn(['INTERESTED', 'CONTACTED', 'TEST_DRIVE', 'QUOTED', 'PURCHASED', 'COLD'])
    .withMessage('Invalid customer status'),
];

export const updateCustomerValidation = [
  param('id')
    .isString()
    .withMessage('Customer ID must be a string')
    .notEmpty()
    .withMessage('Customer ID is required'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),

  body('identityCard')
    .optional()
    .trim()
    .isLength({ min: 9, max: 12 })
    .withMessage('Identity card must be between 9 and 12 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Identity card must contain only numbers'),

  body('status')
    .optional()
    .isIn(['INTERESTED', 'CONTACTED', 'TEST_DRIVE', 'QUOTED', 'PURCHASED', 'COLD'])
    .withMessage('Invalid customer status'),
];

export const customerIdValidation = [
  param('id')
    .isString()
    .withMessage('Customer ID must be a string')
    .notEmpty()
    .withMessage('Customer ID is required'),
];

export const addLifecycleValidation = [
  param('id')
    .isString()
    .withMessage('Customer ID must be a string')
    .notEmpty()
    .withMessage('Customer ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['INTERESTED', 'CONTACTED', 'TEST_DRIVE', 'QUOTED', 'PURCHASED', 'COLD'])
    .withMessage('Invalid customer status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

export const searchCustomerValidation = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isString()
    .withMessage('Search query must be a string')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
];