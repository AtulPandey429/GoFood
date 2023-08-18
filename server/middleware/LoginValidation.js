// validators.js
const Joi = require("joi");

// Define validation schema using Joi
const contactSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Middleware function to validate contact data
function validateLoginData(req, res, next) {
  const { error } = contactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next(); // Move to the next middleware or route handler
}

module.exports = {
  validateLoginData,
};
