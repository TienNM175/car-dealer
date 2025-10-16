import { body } from 'express-validator';

export const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
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
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['ADMIN', 'EVM_STAFF', 'DEALER_MANAGER', 'DEALER_STAFF'])
    .withMessage('Invalid role'),

  body('dealerId')
    .optional()
    .isString()
    .withMessage('Valid dealer ID is required'),
];

export const updateUserValidation = [
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
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('role')
    .optional()
    .isIn(['ADMIN', 'EVM_STAFF', 'DEALER_MANAGER', 'DEALER_STAFF'])
    .withMessage('Invalid role'),

  body('dealerId')
    .optional()
    .isString()
    .withMessage('Valid dealer ID is required'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const assignDealerValidation = [
  body('dealerId')
    .notEmpty()
    .withMessage('Dealer ID is required')
    .isString()
    .withMessage('Valid dealer ID is required'),
];

export const changePasswordValidation = [
  body('oldPassword')
    .custom((value, { req }) => {
      const params = (req as any)?.params || {};
      const userId = (req as any)?.user?.userId;

      // Nếu user tự đổi mật khẩu của chính mình → phải có oldPassword
      if (params.id === userId && !value) {
        throw new Error('Current password is required');
      }
      return true;
    }),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New password must contain at least one special character')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];
