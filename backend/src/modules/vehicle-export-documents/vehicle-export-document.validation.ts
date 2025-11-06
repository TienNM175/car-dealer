import { body, param, query } from "express-validator";

export const createExportDocumentValidation = [
  body("contractId")
    .notEmpty()
    .withMessage("Contract ID is required")
    .isString()
    .withMessage("Contract ID must be a string"),
  body("vehicleUnitId")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Vehicle unit ID must be a string"),
  body("recipientName")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Recipient name must be a string"),
  body("recipientPhone")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Recipient phone must be a string"),
  body("recipientId")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Recipient ID must be a string"),
  body("recipientAddress")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Recipient address must be a string"),
  body("notes")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Notes must be a string"),
];

export const exportDocumentIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Export document ID is required")
    .isString()
    .withMessage("Export document ID must be a string"),
];

export const listExportDocumentsValidation = [
  query("status")
    .optional()
    .isIn(["DRAFT", "APPROVED", "CANCELLED"])
    .withMessage("Invalid export document status"),
  query("dealerId")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("dealerId must be a string"),
  query("vehicleId")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("vehicleId must be a string"),
];

export const cancelExportDocumentValidation = [
  param("id")
    .notEmpty()
    .withMessage("Export document ID is required")
    .isString()
    .withMessage("Export document ID must be a string"),
  body("reason")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Reason must be a string"),
];
