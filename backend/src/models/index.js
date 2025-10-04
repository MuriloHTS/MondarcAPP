const Sequelize = require("sequelize");
const dbConfig = require("../config/database");
const logger = require("../utils/logger");

// Importar modelos
const User = require("./User");
const Company = require("./Company");
const Category = require("./Category");
const Transaction = require("./Transaction");
const UserPreference = require("./UserPreference");

// Determinar ambiente
const environment = process.env.NODE_ENV || "development";
const config = dbConfig[environment];

// Criar instância do Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config,
    logging: config.logging ? (msg) => logger.debug(msg) : false,
  }
);

// Inicializar modelos
const models = {
  User: User.init(sequelize),
  Company: Company.init(sequelize),
  Category: Category.init(sequelize),
  Transaction: Transaction.init(sequelize),
  UserPreference: UserPreference.init(sequelize),
};

// Executar associações
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  ...models,
  sequelize,
  Sequelize,
};
