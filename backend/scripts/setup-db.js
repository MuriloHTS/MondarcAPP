#!/usr/bin/env node

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { sequelize } = require("../src/models");
const logger = require("../src/utils/logger");

async function setupDatabase() {
  try {
    logger.info("🔧 Iniciando configuração do banco de dados...");

    // Testar conexão
    await sequelize.authenticate();
    logger.info("✅ Conexão com banco de dados estabelecida.");

    // Sincronizar modelos (criar tabelas)
    if (process.argv.includes("--force")) {
      logger.warn("⚠️  Modo FORCE ativado. Todas as tabelas serão recriadas!");
      await sequelize.sync({ force: true });
    } else {
      await sequelize.sync({ alter: true });
    }

    logger.info("✅ Tabelas sincronizadas com sucesso.");

    // Criar dados iniciais se especificado
    if (process.argv.includes("--seed")) {
      logger.info("🌱 Criando dados de exemplo...");
      await createSeedData();
      logger.info("✅ Dados de exemplo criados.");
    }

    logger.info("🎉 Configuração do banco de dados concluída!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Erro ao configurar banco de dados:", error);
    process.exit(1);
  }
}

async function createSeedData() {
  const {
    User,
    Company,
    Category,
    Transaction,
    UserPreference,
  } = require("../src/models");

  // Criar empresa de exemplo
  const company = await Company.create({
    name: "Empresa Demo",
    cnpj: "12.345.678/0001-90",
    email: "contato@empresademo.com",
  });

  // Criar usuários empresariais
  // A senha será hasheada automaticamente pelo hook do modelo
  const superUser = await User.create({
    name: "Admin",
    email: "admin@empresa.com",
    password: "123456",
    system_mode: "empresa",
    role: "super",
    company_id: company.id,
  });

  const editorUser = await User.create({
    name: "João Silva",
    email: "joao@empresa.com",
    password: "123456",
    system_mode: "empresa",
    role: "editor",
    company_id: company.id,
  });

  const viewerUser = await User.create({
    name: "Maria Santos",
    email: "maria@empresa.com",
    password: "123456",
    system_mode: "empresa",
    role: "viewer",
    company_id: company.id,
  });

  // Criar usuário pessoal
  const personalUser = await User.create({
    name: "Usuário Pessoal",
    email: "pessoal@email.com",
    password: "123456",
    system_mode: "pessoal",
    role: null,
  });

  // Criar preferências padrão para todos os usuários
  const users = [superUser, editorUser, viewerUser, personalUser];
  for (const user of users) {
    await UserPreference.create({
      user_id: user.id,
    });
  }

  // Criar categorias empresariais
  const categoriesEmpresa = [
    {
      name: "Vendas",
      type: "income",
      budget: 50000,
      month: 1,
      company_id: company.id,
      is_punctual: false,
    },
    {
      name: "Serviços",
      type: "income",
      budget: 30000,
      month: 1,
      company_id: company.id,
      is_punctual: false,
    },
    {
      name: "Salários",
      type: "expense",
      budget: 40000,
      month: 1,
      company_id: company.id,
      is_punctual: false,
    },
    {
      name: "Aluguel",
      type: "expense",
      budget: 5000,
      month: 1,
      company_id: company.id,
      is_punctual: false,
    },
    {
      name: "Marketing",
      type: "expense",
      budget: 10000,
      month: 1,
      company_id: company.id,
      is_punctual: false,
    },
    {
      name: "Despesas Pontuais",
      type: "expense",
      budget: 2000,
      is_punctual: true,
      company_id: company.id,
    },
  ];

  for (const cat of categoriesEmpresa) {
    await Category.create(cat);
  }

  // Criar categorias pessoais
  const categoriesPessoal = [
    {
      name: "Salário",
      type: "income",
      budget: 5000,
      month: 1,
      user_id: personalUser.id,
      is_punctual: false,
    },
    {
      name: "Freelance",
      type: "income",
      budget: 2000,
      month: 1,
      user_id: personalUser.id,
      is_punctual: false,
    },
    {
      name: "Alimentação",
      type: "expense",
      budget: 800,
      month: 1,
      user_id: personalUser.id,
      is_punctual: false,
    },
    {
      name: "Transporte",
      type: "expense",
      budget: 400,
      month: 1,
      user_id: personalUser.id,
      is_punctual: false,
    },
    {
      name: "Lazer",
      type: "expense",
      budget: 500,
      month: 1,
      user_id: personalUser.id,
      is_punctual: false,
    },
    {
      name: "Emergências",
      type: "expense",
      budget: 300,
      is_punctual: true,
      user_id: personalUser.id,
    },
  ];

  for (const cat of categoriesPessoal) {
    await Category.create(cat);
  }

  logger.info("Dados de exemplo criados:");
  logger.info("- 1 empresa");
  logger.info("- 4 usuários (3 empresariais, 1 pessoal)");
  logger.info("- 12 categorias (6 empresariais, 6 pessoais)");
  logger.info("");
  logger.info("Credenciais de acesso:");
  logger.info("Empresarial - Super: admin@empresa.com / 123456");
  logger.info("Empresarial - Editor: joao@empresa.com / 123456");
  logger.info("Empresarial - Visualizador: maria@empresa.com / 123456");
  logger.info("Pessoal: pessoal@email.com / 123456");
}

// Executar setup
setupDatabase();
