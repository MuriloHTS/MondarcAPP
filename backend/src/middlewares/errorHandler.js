const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Error:", err);

  // Erro de validação do Sequelize
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      error: "Erro de validação",
      errors,
    });
  }

  // Erro de constraint único do Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = Object.keys(err.fields)[0];
    return res.status(400).json({
      error: `${field} já está em uso`,
    });
  }

  // Erro de foreign key
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      error: "Referência inválida",
    });
  }

  // Erro de banco de dados
  if (err.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      error: "Erro no banco de dados",
    });
  }

  // Erro customizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Erro genérico
  return res.status(500).json({
    error: "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
