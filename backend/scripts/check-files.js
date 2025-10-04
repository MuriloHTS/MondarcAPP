#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verificando arquivos necessários...\n");

const requiredFiles = [
  "src/app.js",
  "src/routes/index.js",
  "src/routes/auth.routes.js",
  "src/routes/category.routes.js",
  "src/routes/transaction.routes.js",
  "src/routes/user.routes.js",
  "src/routes/report.routes.js",
  "src/routes/settings.routes.js",
  "src/controllers/AuthController.js",
  "src/controllers/CategoryController.js",
  "src/controllers/TransactionController.js",
  "src/middlewares/auth.js",
  "src/middlewares/errorHandler.js",
  "src/middlewares/validate.js",
  "src/models/index.js",
  "src/models/User.js",
  "src/models/Company.js",
  "src/models/Category.js",
  "src/models/Transaction.js",
  "src/models/UserPreference.js",
  "src/utils/logger.js",
  "src/validations/auth.validation.js",
  "src/validations/category.validation.js",
  "src/validations/transaction.validation.js",
  "src/config/auth.js",
  "src/config/database.js",
  ".env",
  "server.js",
];

let missingFiles = [];

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANDO!`);
    missingFiles.push(file);
  }
});

console.log("\n📊 Resumo:");
console.log(`Total de arquivos: ${requiredFiles.length}`);
console.log(
  `Arquivos encontrados: ${requiredFiles.length - missingFiles.length}`
);
console.log(`Arquivos faltando: ${missingFiles.length}`);

if (missingFiles.length > 0) {
  console.log("\n❌ Arquivos faltando:");
  missingFiles.forEach((file) => console.log(`   - ${file}`));
  process.exit(1);
} else {
  console.log("\n✅ Todos os arquivos necessários estão presentes!");
}
