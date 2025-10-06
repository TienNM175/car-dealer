import { body, param } from 'express-validator';

export const createDealerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Dealer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Dealer name must be between 2 and 100 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Dealer code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Dealer code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Dealer code must contain only uppercase letters, numbers, and hyphens'),

  body('regionId')
    .notEmpty()
    .withMessage('Region ID is required')
    .isString()
    .withMessage('Region ID must be a string'),

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

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

export const updateDealerValidation = [
  param('id')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Dealer name must be between 2 and 100 characters'),

  body('regionId')
    .optional()
    .isString()
    .withMessage('Region ID must be a string'),

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

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const dealerIdValidation = [
  param('id')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),
];

export const addStaffValidation = [
  param('id')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),

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

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['DEALER_MANAGER', 'DEALER_STAFF'])
    .withMessage('Role must be DEALER_MANAGER or DEALER_STAFF'),
];

export const updateStaffValidation = [
  param('id')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  param('staffId')
    .isString()
    .withMessage('Staff ID must be a string')
    .notEmpty()
    .withMessage('Staff ID is required'),

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

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('role')
    .optional()
    .isIn(['DEALER_MANAGER', 'DEALER_STAFF'])
    .withMessage('Role must be DEALER_MANAGER or DEALER_STAFF'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const staffIdValidation = [
  param('id')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  param('staffId')
    .isString()
    .withMessage('Staff ID must be a string')
    .notEmpty()
    .withMessage('Staff ID is required'),
];

export const setTargetValidation = [
  param('id')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),

  body('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ min: 0 })
    .withMessage('Target amount must be a positive number'),
];