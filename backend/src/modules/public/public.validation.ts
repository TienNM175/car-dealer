// backend/src/modules/public/public.validation.ts
import { body } from 'express-validator';

export const createPublicTestDriveValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),

  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required'),

  body('dealerId')
    .notEmpty()
    .withMessage('Dealer ID is required'),

  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Date must be in the future');
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }),
];