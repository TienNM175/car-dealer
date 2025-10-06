import { body, param } from 'express-validator';

export const createQuotationValidation = [
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isString()
    .withMessage('Customer ID must be a string'),

  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isString()
    .withMessage('Vehicle ID must be a string'),

  body('basePrice')
    .optional()
    .isNumeric()
    .withMessage('Base price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Base price cannot be negative'),

  body('discount')
    .optional()
    .isNumeric()
    .withMessage('Discount must be a number')
    .custom((value) => value >= 0)
    .withMessage('Discount cannot be negative'),

  body('paymentType')
    .optional()
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('Payment type must be FULL or INSTALLMENT'),

  body('installmentMonths')
    .optional()
    .isInt({ min: 6, max: 120 })
    .withMessage('Installment months must be between 6 and 120'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      return date > now;
    })
    .withMessage('Valid until date must be in the future'),

  body('status')
    .optional()
    .isIn(['DRAFT', 'SENT'])
    .withMessage('Initial status must be DRAFT or SENT'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
];

export const updateQuotationValidation = [
  body('basePrice')
    .optional()
    .isNumeric()
    .withMessage('Base price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Base price cannot be negative'),

  body('discount')
    .optional()
    .isNumeric()
    .withMessage('Discount must be a number')
    .custom((value) => value >= 0)
    .withMessage('Discount cannot be negative'),

  body('paymentType')
    .optional()
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('Payment type must be FULL or INSTALLMENT'),

  body('installmentMonths')
    .optional()
    .isInt({ min: 6, max: 120 })
    .withMessage('Installment months must be between 6 and 120'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
];

export const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
    .withMessage('Invalid status value'),
];

export const idValidation = [
  param('id')
    .isString()
    .withMessage('ID must be a string')
    .notEmpty()
    .withMessage('ID is required'),
];

export const quoteNumberValidation = [
  param('quoteNumber')
    .isString()
    .withMessage('Quote number must be a string')
    .notEmpty()
    .withMessage('Quote number is required')
    .matches(/^QT\d{6}\d{4}$/)
    .withMessage('Invalid quote number format (expected: QT202401XXXX)'),
];

export const customerIdValidation = [
  param('customerId')
    .isString()
    .withMessage('Customer ID must be a string')
    .notEmpty()
    .withMessage('Customer ID is required'),
];