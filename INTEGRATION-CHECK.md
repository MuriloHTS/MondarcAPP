# Guia de Verificação da Integração Frontend-Backend

## 📋 Checklist de Integração

### 1. Preparação do Ambiente

#### Backend (Terminal 1):
```bash
cd backend
npm install  # Se ainda não instalou
npm run dev  # Servidor rodando em http://localhost:3001
```

#### Frontend (Terminal 2):
```bash
cd frontend
npm install  # Se ainda não instalou
npm start    # App rodando em http://localhost:3000
```

### 2. Verificações Essenciais

#### ✅ Arquivo .env do Frontend
Confirme que existe o arquivo `frontend/.env` com:
```
REACT_APP_API_URL=http://localhost:3001/api
```

#### ✅ CORS no Backend
O backend já está configurado com CORS permitindo `http://localhost:3000`

### 3. Teste Manual de Integração

#### Passo 1: Login
1. Abra http://localhost:3000
2. Use as credenciais: `admin@empresa.com` / `123456`
3. Verifique no Console (F12) se não há erros de CORS ou conexão

#### Passo 2: Verificar Token
No console do navegador, execute:
```javascript
localStorage.getItem('@FinanceControl:token')
// Deve retornar um token JWT
```

#### Passo 3: Testar Requisições
No console do navegador, cole e execute o teste:
```javascript
// Teste rápido de integração
const token = localStorage.getItem('@FinanceControl:token');
fetch('http://localhost:3001/api/categories', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log('Categorias:', data))
.catch(err => console.error('Erro:', err));
```

### 4. Pontos de Integração por Tela

#### 🏠 Menu Principal
- [x] Login funcional
- [x] Exibição do nome do usuário
- [x] Logout limpa localStorage

#### 📊 Planejamento
- [ ] Listar categorias por mês
- [ ] Criar nova categoria
- [ ] Deletar categoria
- [ ] Filtros por mês funcionando

#### 💰 Lançamentos
- [ ] Listar transações
- [ ] Criar transação (vinculada a categoria)
- [ ] Criar lançamento pontual
- [ ] Busca e filtros
- [ ] Ordenação

#### 📈 Relatórios
- [ ] Carregar summary do período
- [ ] Gráficos com dados reais
- [ ] Exportar PDF
- [ ] Exportar CSV
- [ ] Análise de tendências

#### 👥 Usuários (Super apenas)
- [ ] Listar usuários da empresa
- [ ] Criar novo usuário
- [ ] Atualizar usuário
- [ ] Deletar usuário

#### ⚙️ Configurações
- [ ] Carregar preferências
- [ ] Salvar preferências
- [ ] Aplicar tema dark/light

### 5. Problemas Comuns e Soluções

#### ❌ Erro: "Network Error" ou CORS
**Solução**: Verifique se o backend está rodando em http://localhost:3001

#### ❌ Erro: "401 Unauthorized"
**Solução**: Token expirado, faça logout e login novamente

#### ❌ Erro: "Cannot read property 'data' of undefined"
**Solução**: O serviço pode não estar retornando no formato esperado

### 6. Debug Avançado

#### Verificar Headers da Requisição
```javascript
// No console do navegador
const token = localStorage.getItem('@FinanceControl:token');
console.log('Token:', token ? 'Presente' : 'Ausente');
console.log('Token válido:', token && token.split('.').length === 3);
```

#### Testar Serviço Direto
```javascript
// Teste direto do serviço (execute no contexto React)
import categoryService from './services/categoryService';

categoryService.getAll()
  .then(data => console.log('Categorias via serviço:', data))
  .catch(err => console.error('Erro no serviço:', err));
```

### 7. Script de Teste Completo

Execute no console após fazer login:
```javascript
// Copie e cole o conteúdo de test-integration.js aqui
```

## 🚀 Próximos Passos

1. **Se tudo funcionar**:
   - Faça commits das alterações
   - Prepare para deploy

2. **Se houver erros**:
   - Verifique os logs do backend
   - Confirme que os endpoints estão corretos
   - Teste cada serviço individualmente

## 📞 Suporte

Se encontrar problemas específicos:
1. Verifique o console do navegador (F12)
2. Verifique os logs do backend
3. Teste o endpoint direto com cURL ou Postman
4. Confirme que o token está sendo enviado
