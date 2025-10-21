// validators/authValidator.js
const { body, validationResult } = require("express-validator");

const signupRules = [
  body("username")
    .exists().withMessage("Username required")
    .bail()
    .isString().trim().notEmpty().withMessage("Username cannot be empty")
    .isLength({ max: 50 }).withMessage("Username too long"),
  body("email")
    .exists().withMessage("Email required")
    .bail()
    .isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password")
    .exists().withMessage("Password required")
    .bail()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const signinRules = [
  body("email").exists().withMessage("Email required").bail().isEmail().normalizeEmail(),
  body("password").exists().withMessage("Password required")
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(e => ({ param: e.param, msg: e.msg })) });
  next();
}

module.exports = { signupRules, signinRules, validate };
