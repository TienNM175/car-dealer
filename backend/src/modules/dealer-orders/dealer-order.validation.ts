import { body, param } from 'express-validator';

export const createDealerOrderValidation = [
  body('dealerId')
    .notEmpty()
    .withMessage('Dealer ID is required')
    .isString()
    .withMessage('Dealer ID must be a string'),

  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isString()
    .withMessage('Staff ID must be a string'),

  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isString()
    .withMessage('Vehicle ID must be a string'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

export const updateDealerOrderValidation = [
  param('id')
    .isString()
    .withMessage('Order ID must be a string')
    .notEmpty()
    .withMessage('Order ID is required'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

export const updateDealerOrderStatusValidation = [
  param('id')
    .isString()
    .withMessage('Order ID must be a string')
    .notEmpty()
    .withMessage('Order ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid order status'),
];

export const cancelDealerOrderValidation = [
  param('id')
    .isString()
    .withMessage('Order ID must be a string')
    .notEmpty()
    .withMessage('Order ID is required'),

  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

export const dealerOrderIdValidation = [
  param('id')
    .isString()
    .withMessage('Order ID must be a string')
    .notEmpty()
    .withMessage('Order ID is required'),
];