// validators/taskValidator.js
const { body, validationResult } = require("express-validator");

const taskValidationRules = [
  body("title")
    .exists().withMessage("Title is required")
    .bail()
    .isString().withMessage("Title must be a string")
    .trim()
    .notEmpty().withMessage("Title cannot be empty")
    .isLength({ max: 100 }).withMessage("Title must be at most 100 characters"),
  body("description")
    .exists().withMessage("Description is required")
    .bail()
    .isString().withMessage("Description must be a string")
    .trim()
    .notEmpty().withMessage("Description cannot be empty")
    .isLength({ max: 500 }).withMessage("Description must be at most 500 characters")
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => ({ param: e.param, msg: e.msg })) });
  }
  next();
}

module.exports = { taskValidationRules, validate };
