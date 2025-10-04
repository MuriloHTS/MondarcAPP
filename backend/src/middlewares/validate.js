// backend/src/middlewares/validate.js
const Joi = require("joi");

/**
 * Middleware de validação usando Joi
 * @param {Object} schema - Objeto com schemas para body, query, params
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    // Validar cada parte da requisição (body, query, params)
    ["body", "query", "params"].forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          convert: true,
        });

        if (error) {
          error.details.forEach((detail) => {
            validationErrors.push({
              field: detail.path.join("."),
              message: detail.message,
            });
          });
        } else {
          // Substituir pelos valores validados (com conversões aplicadas)
          req[key] = value;
        }
      }
    });

    // Se houver erros, retornar
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Erro de validação",
        errors: validationErrors,
      });
    }

    // Se não houver erros, continuar
    next();
  };
};

module.exports = validate;
