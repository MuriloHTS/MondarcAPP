#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verificando configuração do projeto...\n");

// Verificar se .env existe
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ Arquivo .env não encontrado!");
  console.log("   Execute: cp .env.example .env");
  console.log("   E configure suas variáveis de ambiente.\n");
  process.exit(1);
} else {
  console.log("✅ Arquivo .env encontrado");
}

// Verificar variáveis essenciais
require("dotenv").config({ path: envPath });
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASS",
  "JWT_SECRET",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Variáveis de ambiente faltando:", missingVars.join(", "));
  console.log("   Configure estas variáveis no arquivo .env\n");
  process.exit(1);
} else {
  console.log("✅ Variáveis de ambiente configuradas");
}

// Verificar conexão com banco
const { sequelize } = require("../src/models");

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com banco de dados OK");

    // Verificar se as tabelas existem
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_catalog = '${process.env.DB_NAME}'
    `);

    if (results.length === 0) {
      console.log("⚠️  Nenhuma tabela encontrada no banco");
      console.log("   Execute: node scripts/setup-db.js");
    } else {
      console.log(`✅ ${results.length} tabelas encontradas no banco`);
    }

    console.log("\n🎉 Configuração verificada com sucesso!");
    console.log("   Para iniciar o servidor: npm run dev\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao conectar com banco de dados:", error.message);
    console.log("\n   Verifique:");
    console.log("   1. Se o PostgreSQL está rodando");
    console.log("   2. Se o banco de dados existe");
    console.log("   3. Se as credenciais estão corretas no .env\n");
    process.exit(1);
  }
}

checkDatabase();
