import { body, param } from 'express-validator';

export const createTestDriveValidation = [
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

  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isString()
    .withMessage('Staff ID must be a string'),

  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Scheduled date must be in the future');
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

export const updateTestDriveValidation = [
  param('id')
    .isString()
    .withMessage('Test drive ID must be a string')
    .notEmpty()
    .withMessage('Test drive ID is required'),

  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('feedback')
    .optional()
    .isString()
    .withMessage('Feedback must be a string')
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
];

export const updateTestDriveStatusValidation = [
  param('id')
    .isString()
    .withMessage('Test drive ID must be a string')
    .notEmpty()
    .withMessage('Test drive ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .withMessage('Invalid test drive status'),

  body('feedback')
    .optional()
    .isString()
    .withMessage('Feedback must be a string')
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
];

export const cancelTestDriveValidation = [
  param('id')
    .isString()
    .withMessage('Test drive ID must be a string')
    .notEmpty()
    .withMessage('Test drive ID is required'),

  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

export const testDriveIdValidation = [
  param('id')
    .isString()
    .withMessage('Test drive ID must be a string')
    .notEmpty()
    .withMessage('Test drive ID is required'),
];