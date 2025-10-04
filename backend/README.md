# Backend - Sistema de Controle Financeiro

## 📋 Status do Desenvolvimento

### ✅ Implementado
- **Autenticação JWT** com refresh token
- **Sistema de roles** (super, editor, viewer)
- **Controllers completos**:
  - AuthController (login, registro, refresh token)
  - UserController (CRUD + preferências)
  - CategoryController (CRUD com filtros)
  - TransactionController (CRUD + summary)
  - ReportController (relatórios, exportação PDF/CSV, tendências)
  - SettingsController (configurações sistema/usuário)
- **Validações** com Joi
- **Middlewares** de autenticação e autorização
- **Logs** estruturados com Winston
- **Segurança** com Helmet, CORS, Rate Limiting

### 🔧 Tecnologias
- Node.js + Express
- PostgreSQL + Sequelize ORM
- JWT para autenticação
- Bcrypt para hash de senhas
- PDFKit para geração de PDFs
- json2csv para exportação CSV

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Banco de Dados
Crie um arquivo `.env` na raiz do backend:
```env
NODE_ENV=development
PORT=3001

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_control_dev
DB_USER=postgres
DB_PASS=

# JWT
JWT_SECRET=sua-chave-secreta-aqui
JWT_REFRESH_SECRET=sua-chave-refresh-aqui

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 3. Criar/Resetar Banco
```bash
# Verificar configuração
npm run check

# Criar banco e tabelas
npm run setup

# Popular com dados de exemplo
npm run setup:seed
```

### 4. Executar o Servidor
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

## 🧪 Testar Endpoints

### Teste Manual Rápido
```bash
# Instalar axios globalmente se não tiver
npm install -g axios

# Executar script de teste
node scripts/test-backend-integration.js
```

### Teste com cURL

#### 1. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"123456"}'
```

#### 2. Listar Categorias (com token)
```bash
curl -X GET http://localhost:3001/api/categories \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Teste com Postman/Insomnia
Importe a collection disponível em `docs/postman-collection.json`

## 📚 Documentação da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro (usuários pessoais)
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Dados do usuário logado
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Alterar senha

### Usuários
- `GET /api/users` - Listar usuários (super only)
- `GET /api/users/:id` - Buscar usuário
- `POST /api/users` - Criar usuário (super only)
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário (super only)
- `GET /api/users/preferences` - Buscar preferências
- `PUT /api/users/preferences` - Atualizar preferências

### Categorias
- `GET /api/categories` - Listar categorias
- `GET /api/categories/:id` - Buscar categoria
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Deletar categoria

### Transações
- `GET /api/transactions` - Listar transações
- `GET /api/transactions/summary` - Resumo
- `GET /api/transactions/:id` - Buscar transação
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação

### Relatórios
- `GET /api/reports/summary` - Resumo geral
- `GET /api/reports/detailed` - Relatório detalhado
- `GET /api/reports/trends` - Análise de tendências
- `GET /api/reports/export/pdf` - Exportar PDF
- `GET /api/reports/export/csv` - Exportar CSV

### Configurações
- `GET /api/settings/system` - Config do sistema
- `PUT /api/settings/company` - Atualizar empresa
- `GET /api/settings/notifications` - Config notificações
- `PUT /api/settings/notifications` - Atualizar notificações
- `GET /api/settings/export` - Config exportação
- `PUT /api/settings/export` - Atualizar exportação
- `GET /api/settings/stats` - Estatísticas

## 🔐 Usuários de Teste

### Modo Empresa
- **Super Admin**: admin@empresa.com / 123456
- **Editor**: joao@empresa.com / 123456
- **Visualizador**: maria@empresa.com / 123456

### Modo Pessoal
- **Usuário**: usuario@pessoal.com / 123456

## 🐛 Troubleshooting

### Erro de Conexão com Banco
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no `.env`
3. Execute `npm run check` para diagnóstico

### Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro de Permissão (Linux/Mac)
```bash
# Dar permissão de execução aos scripts
chmod +x scripts/*.js
```

## 📝 Próximos Passos para MVP

1. **Integração Frontend-Backend**
   - [ ] Conectar serviços do frontend com API
   - [ ] Implementar refresh token no frontend
   - [ ] Ajustar CORS para produção

2. **Melhorias de Segurança**
   - [ ] Implementar blacklist de tokens
   - [ ] Adicionar auditoria de ações
   - [ ] Configurar HTTPS

3. **Performance**
   - [ ] Adicionar cache Redis
   - [ ] Otimizar queries com índices
   - [ ] Implementar paginação eficiente

4. **Deploy**
   - [ ] Configurar Docker
   - [ ] Setup CI/CD
   - [ ] Configurar monitoramento

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request
