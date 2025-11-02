import { body, param } from 'express-validator';

export const createContractValidation = [
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isString()
    .withMessage('Customer ID must be a string'),

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

  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number')
    .custom((value, { req }) => {
      if (value && req.body.basePrice && value > req.body.basePrice) {
        throw new Error('Discount cannot exceed base price');
      }
      return true;
    }),

  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number'),

  body('paymentType')
    .notEmpty()
    .withMessage('Payment type is required')
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('Payment type must be FULL or INSTALLMENT'),

  body('installmentMonths')
    .if(body('paymentType').equals('INSTALLMENT'))
    .notEmpty()
    .withMessage('Installment months is required for installment payment')
    .isInt({ min: 1, max: 120 })
    .withMessage('Installment months must be between 1 and 120'),

  body('interestRate')
    .if(body('paymentType').equals('INSTALLMENT'))
    .notEmpty()
    .withMessage('Interest rate is required for installment payment')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Interest rate must be between 0 and 100'),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('Delivery date cannot be in the past');
      }
      return true;
    }),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

export const updateContractValidation = [
  param('id')
    .isString()
    .withMessage('Contract ID must be a string')
    .notEmpty()
    .withMessage('Contract ID is required'),

  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number'),

  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number'),

  body('paymentType')
    .optional()
    .isIn(['FULL', 'INSTALLMENT'])
    .withMessage('Payment type must be FULL or INSTALLMENT'),

  body('installmentMonths')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Installment months must be between 1 and 120'),

  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Interest rate must be between 0 and 100'),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

export const updateContractStatusValidation = [
  param('id')
    .isString()
    .withMessage('Contract ID must be a string')
    .notEmpty()
    .withMessage('Contract ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['DRAFT', 'PENDING', 'SIGNED', 'DELIVERING', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid contract status'),
];

export const contractIdValidation = [
  param('id')
    .isString()
    .withMessage('Contract ID must be a string')
    .notEmpty()
    .withMessage('Contract ID is required'),
];