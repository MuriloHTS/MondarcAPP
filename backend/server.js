require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3001;

// Função para iniciar o servidor
async function startServer() {
  try {
    // Testar conexão com o banco de dados
    await sequelize.authenticate();
    logger.info("✅ Conexão com banco de dados estabelecida com sucesso.");

    // Sincronizar modelos com o banco (em produção, use migrations)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("✅ Modelos sincronizados com o banco de dados.");
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err);
  process.exit(1);
});

// Iniciar servidor
startServer();
