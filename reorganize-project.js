#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔧 Reorganizando estrutura do projeto...\n");

// Diretório atual (raiz do projeto)
const rootDir = process.cwd();

// Arquivos do frontend que precisam ser movidos
const frontendFiles = [
  "src/App.css",
  "src/App.js",
  "src/App.test.js",
  "src/index.css",
  "src/index.js",
  "src/logo.svg",
  "src/reportWebVitals.js",
  "src/setupTests.js",
];

// Arquivos/pastas que devem ficar na raiz
const rootFiles = [".gitignore", "README.md", "estrutura_pastas.txt"];

console.log("1. Criando nova estrutura de pastas...");

// Criar pasta frontend se não existir
const frontendDir = path.join(rootDir, "frontend");
if (!fs.existsSync(frontendDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
  console.log("✅ Pasta frontend criada");
}

// Criar src dentro de frontend
const frontendSrcDir = path.join(frontendDir, "src");
if (!fs.existsSync(frontendSrcDir)) {
  fs.mkdirSync(frontendSrcDir, { recursive: true });
  console.log("✅ Pasta frontend/src criada");
}

// Renomear pasta backend
const oldBackendPath = path.join(rootDir, "src", "backend");
const newBackendPath = path.join(rootDir, "backend");

if (fs.existsSync(oldBackendPath) && !fs.existsSync(newBackendPath)) {
  console.log("\n2. Movendo backend para a raiz...");
  fs.renameSync(oldBackendPath, newBackendPath);
  console.log("✅ Backend movido para ./backend");
}

// Mover arquivos do frontend
console.log("\n3. Movendo arquivos do frontend...");
frontendFiles.forEach((file) => {
  const oldPath = path.join(rootDir, file);
  const fileName = path.basename(file);
  const newPath = path.join(frontendSrcDir, fileName);

  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Movido: ${file} -> frontend/src/${fileName}`);
  }
});

// Mover public para frontend
const oldPublicPath = path.join(rootDir, "public");
const newPublicPath = path.join(frontendDir, "public");
if (fs.existsSync(oldPublicPath) && !fs.existsSync(newPublicPath)) {
  fs.renameSync(oldPublicPath, newPublicPath);
  console.log("✅ Pasta public movida para frontend/");
}

// Copiar package.json para frontend (se existir)
const rootPackageJson = path.join(rootDir, "package.json");
const frontendPackageJson = path.join(frontendDir, "package.json");
if (fs.existsSync(rootPackageJson) && !fs.existsSync(frontendPackageJson)) {
  // Ler o package.json atual
  const packageContent = JSON.parse(fs.readFileSync(rootPackageJson, "utf8"));

  // Se for um projeto React, copiar para frontend
  if (packageContent.dependencies && packageContent.dependencies.react) {
    fs.copyFileSync(rootPackageJson, frontendPackageJson);
    console.log("✅ package.json copiado para frontend/");
  }
}

// Criar .gitignore para frontend se não existir
const frontendGitignore = path.join(frontendDir, ".gitignore");
if (!fs.existsSync(frontendGitignore)) {
  const gitignoreContent = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
`;
  fs.writeFileSync(frontendGitignore, gitignoreContent);
  console.log("✅ .gitignore criado para frontend/");
}

// Limpar pasta src vazia
const oldSrcDir = path.join(rootDir, "src");
if (fs.existsSync(oldSrcDir)) {
  try {
    fs.rmdirSync(oldSrcDir);
    console.log("✅ Pasta src vazia removida");
  } catch (e) {
    // Pasta não está vazia, deixar
  }
}

// Criar package.json na raiz para gerenciar os dois projetos
const rootPackageJsonNew = {
  name: "financial-system",
  version: "1.0.0",
  description: "Sistema de Controle Financeiro Universal",
  scripts: {
    dev: 'concurrently "npm run dev:backend" "npm run dev:frontend"',
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm start",
    "install:all":
      "npm install && cd backend && npm install && cd ../frontend && npm install",
    "build:frontend": "cd frontend && npm run build",
    "start:backend": "cd backend && npm start",
  },
  devDependencies: {
    concurrently: "^7.6.0",
  },
};

fs.writeFileSync(
  path.join(rootDir, "package-root.json"),
  JSON.stringify(rootPackageJsonNew, null, 2)
);
console.log(
  "✅ package-root.json criado na raiz (renomeie para package.json após verificar)"
);

// Criar README.md principal
const mainReadme = `# Sistema de Controle Financeiro Universal

Sistema completo de controle financeiro para empresas e pessoas físicas.

## 📁 Estrutura do Projeto

\`\`\`
financial/
├── backend/           # API REST (Node.js + Express + PostgreSQL)
├── frontend/          # Interface Web (React)
└── README.md         # Este arquivo
\`\`\`

## 🚀 Como Executar

### Instalação completa
\`\`\`bash
npm run install:all
\`\`\`

### Executar em desenvolvimento (backend + frontend)
\`\`\`bash
npm run dev
\`\`\`

### Executar apenas o backend
\`\`\`bash
npm run dev:backend
\`\`\`

### Executar apenas o frontend
\`\`\`bash
npm run dev:frontend
\`\`\`

## 📚 Documentação

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
`;

fs.writeFileSync(path.join(rootDir, "README-NEW.md"), mainReadme);
console.log("✅ README-NEW.md criado na raiz");

console.log("\n✨ Reorganização concluída!");
console.log("\n📋 Próximos passos:");
console.log("1. Verifique se tudo está correto");
console.log("2. Renomeie package-root.json para package.json");
console.log("3. Renomeie README-NEW.md para README.md");
console.log("4. Execute: npm install (na raiz)");
console.log("5. Execute: npm run install:all");
console.log("6. Para rodar o projeto: npm run dev");

console.log("\n⚠️  Importante:");
console.log("- Se houver node_modules em lugares errados, delete-os");
console.log("- O frontend agora está em ./frontend");
console.log("- O backend agora está em ./backend");
