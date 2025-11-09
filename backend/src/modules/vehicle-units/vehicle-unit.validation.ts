import { body, param, query } from "express-validator";

const vehicleUnitStatuses = [
  "IN_STOCK",
  "RESERVED",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNED",
  "DAMAGED",
];

const vehicleUnitStorageTypes = ["EVM", "DEALER", "IN_TRANSIT"];

const vehicleColors = [
  "BLACK",
  "WHITE",
  "SILVER",
  "GREY",
  "RED",
  "BLUE",
  "GREEN",
  "YELLOW",
  "ORANGE",
  "BROWN",
  "GOLD",
  "BEIGE",
  "OTHER",
];

export const createVehicleUnitValidation = [
  body("vehicleId")
    .notEmpty()
    .withMessage("Vehicle ID is required")
    .isString()
    .withMessage("Vehicle ID must be a string"),
  body("vin")
    .notEmpty()
    .withMessage("VIN is required")
    .isString()
    .withMessage("VIN must be a string")
    .isLength({ min: 6, max: 32 })
    .withMessage("VIN must be between 6 and 32 characters"),
  body("engineNumber")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Engine number must be a string"),
  body("batterySerial")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Battery serial must be a string"),
  body("color")
    .optional({ checkFalsy: true })
    .isIn(vehicleColors)
    .withMessage("Invalid vehicle color"),
  body("status")
    .optional()
    .isIn(vehicleUnitStatuses)
    .withMessage("Invalid vehicle unit status"),
  body("storageType")
    .optional()
    .isIn(vehicleUnitStorageTypes)
    .withMessage("Invalid storage type"),
  body("dealerId")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Dealer ID must be a string"),
  body("location")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Location must be a string"),
  body("manufacturedAt")
    .optional()
    .isISO8601()
    .withMessage("Manufactured date must be a valid ISO date"),
  body("importedAt")
    .optional()
    .isISO8601()
    .withMessage("Imported date must be a valid ISO date"),
];

export const updateVehicleUnitValidation = [
  param("id")
    .notEmpty()
    .withMessage("Vehicle unit ID is required")
    .isString()
    .withMessage("Vehicle unit ID must be a string"),
  body("engineNumber")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Engine number must be a string"),
  body("batterySerial")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Battery serial must be a string"),
  body("color")
    .optional({ checkFalsy: true })
    .isIn(vehicleColors)
    .withMessage("Invalid vehicle color"),
  body("status")
    .optional()
    .isIn(vehicleUnitStatuses)
    .withMessage("Invalid vehicle unit status"),
  body("storageType")
    .optional()
    .isIn(vehicleUnitStorageTypes)
    .withMessage("Invalid storage type"),
  body("dealerId")
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === "string")
    .withMessage("Dealer ID must be a string or null"),
  body("location")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Location must be a string"),
  body("manufacturedAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Manufactured date must be a valid ISO date"),
  body("importedAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Imported date must be a valid ISO date"),
];

export const getAvailableVehicleUnitsValidation = [
  query("vehicleId")
    .notEmpty()
    .withMessage("vehicleId query parameter is required")
    .isString()
    .withMessage("vehicleId must be a string"),
  query("dealerId")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("dealerId must be a string"),
];
