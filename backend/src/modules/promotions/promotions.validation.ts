import { body, param } from 'express-validator';

export const createPromotionValidation = [
  body('dealerId')
    .optional()
    .isString()
    .withMessage('Dealer ID must be a string'),

  body('name')
    .notEmpty()
    .withMessage('Promotion name is required')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['PERCENTAGE', 'FIXED'])
    .withMessage('Discount type must be PERCENTAGE or FIXED'),

  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isNumeric()
    .withMessage('Discount value must be a number')
    .custom((value) => value > 0)
    .withMessage('Discount value must be greater than 0'),

  body('minPurchase')
    .optional()
    .isNumeric()
    .withMessage('Minimum purchase must be a number')
    .custom((value) => value >= 0)
    .withMessage('Minimum purchase cannot be negative'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const updatePromotionValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('discountType')
    .optional()
    .isIn(['PERCENTAGE', 'FIXED'])
    .withMessage('Discount type must be PERCENTAGE or FIXED'),

  body('discountValue')
    .optional()
    .isNumeric()
    .withMessage('Discount value must be a number')
    .custom((value) => value > 0)
    .withMessage('Discount value must be greater than 0'),

  body('minPurchase')
    .optional()
    .isNumeric()
    .withMessage('Minimum purchase must be a number')
    .custom((value) => value >= 0)
    .withMessage('Minimum purchase cannot be negative'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .custom((value) => {
      // Allow null to clear end date
      if (value === null) return true;
      return new Date(value) instanceof Date && !isNaN(new Date(value).getTime());
    })
    .withMessage('End date must be a valid date or null'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const calculateDiscountValidation = [
  body('dealerId')
    .notEmpty()
    .withMessage('Dealer ID is required')
    .isString()
    .withMessage('Dealer ID must be a string'),

  body('purchaseAmount')
    .notEmpty()
    .withMessage('Purchase amount is required')
    .isNumeric()
    .withMessage('Purchase amount must be a number')
    .custom((value) => value > 0)
    .withMessage('Purchase amount must be positive'),

  body('promotionId')
    .optional()
    .isString()
    .withMessage('Promotion ID must be a string'),
];

export const idValidation = [
  param('id')
    .isString()
    .withMessage('ID must be a string')
    .notEmpty()
    .withMessage('ID is required'),
];

export const dealerIdValidation = [
  param('dealerId')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),
];