import { body, param } from 'express-validator';

export const updateEVMInventoryValidation = [
  param('vehicleId')
    .isString()
    .withMessage('Vehicle ID must be a string')
    .notEmpty()
    .withMessage('Vehicle ID is required'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('reserved')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reserved must be a non-negative integer'),

  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim(),
];

export const updateDealerInventoryValidation = [
  param('dealerId')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  param('vehicleId')
    .isString()
    .withMessage('Vehicle ID must be a string')
    .notEmpty()
    .withMessage('Vehicle ID is required'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('reserved')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reserved must be a non-negative integer'),

  body('sold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sold must be a non-negative integer'),

  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim(),
];

export const transferInventoryValidation = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isString()
    .withMessage('Vehicle ID must be a string'),

  body('fromDealerId')
    .notEmpty()
    .withMessage('From Dealer ID is required')
    .isString()
    .withMessage('From Dealer ID must be a string'),

  body('toDealerId')
    .notEmpty()
    .withMessage('To Dealer ID is required')
    .isString()
    .withMessage('To Dealer ID must be a string')
    .custom((value, { req }) => {
      if (value === req.body.fromDealerId) {
        throw new Error('Cannot transfer to the same dealer');
      }
      return true;
    }),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim(),
];

export const reserveInventoryValidation = [
  param('dealerId')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  param('vehicleId')
    .isString()
    .withMessage('Vehicle ID must be a string')
    .notEmpty()
    .withMessage('Vehicle ID is required'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

export const completeSaleValidation = [
  param('dealerId')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  param('vehicleId')
    .isString()
    .withMessage('Vehicle ID must be a string')
    .notEmpty()
    .withMessage('Vehicle ID is required'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

export const cancelReservationValidation = [
  param('dealerId')
    .isString()
    .withMessage('Dealer ID must be a string')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  param('vehicleId')
    .isString()
    .withMessage('Vehicle ID must be a string')
    .notEmpty()
    .withMessage('Vehicle ID is required'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];