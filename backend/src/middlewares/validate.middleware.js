/**
 * Generic request body validator
 * Works with any schema library that exposes a .validate(data) method (Joi, Yup, zod, etc.)
 *
 * Usage with Joi:
 *   const Joi = require('joi');
 *   const schema = Joi.object({ email: Joi.string().email().required() });
 *   router.post('/', validate(schema), controller.create);
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, ''));
    return res.status(422).json({ success: false, message: 'Validation failed', errors: messages });
  }
  next();
};

module.exports = validate;
