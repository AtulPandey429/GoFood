// validators.js
const Joi = require("joi");

// Define validation schema using Joi
const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  location: Joi.string().required(),
});

// Middleware function to validate contact data
function validateContactData(req, res, next) {
  const { error } = contactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next(); // Move to the next middleware or route handler
}

module.exports = {
  validateContactData,
};
