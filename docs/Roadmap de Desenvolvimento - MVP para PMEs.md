# Roadmap de Desenvolvimento - MVP para PMEs

Este roadmap foca no desenvolvimento de um Produto Mínimo Viável (MVP) para PMEs, priorizando as funcionalidades essenciais para que uma empresa de pequeno a médio porte (como a de venda e instalação de ar condicionado) possa ter uma visão clara de suas finanças (receitas, despesas, lucro/prejuízo) e projeções. O sistema visual (frontend) já existente será a base, e o foco será na funcionalidade e no backend necessário para suportá-la.

**Objetivo do MVP:** Entregar um sistema funcional e vendável que permita a PMEs gerenciar suas finanças básicas, com controle de usuários e relatórios essenciais para tomada de decisão.

**Estimativa de Tempo:** As estimativas são aproximadas e podem variar dependendo da equipe de desenvolvimento, complexidade exata de cada requisito e imprevistos. São apresentadas em semanas.

## Fase 1: Backend Essencial e Autenticação (4-6 semanas)

Esta fase estabelece a fundação do backend e o sistema de autenticação multi-usuário, crucial para PMEs.

### Etapas:

1.  **Configuração do Ambiente Backend (1 semana)**
    *   Inicialização do projeto Node.js/Express.
    *   Configuração do PostgreSQL.
    *   Estrutura inicial de pastas e arquivos.
    *   Configuração de ORM (ex: Sequelize ou Prisma) para interação com o banco de dados.

2.  **Desenvolvimento do Módulo de Usuários e Autenticação (2-3 semanas)**
    *   Modelagem do banco de dados para usuários (incluindo `id`, `name`, `email`, `password`, `role`).
    *   Implementação da API REST para registro e login de usuários.
    *   Implementação de autenticação JWT (JSON Web Tokens).
    *   Implementação de middleware de autorização para os três níveis hierárquicos (Super Usuário, Editor, Visualizador).
    *   Endpoints para gestão de usuários (criação, edição, exclusão de usuários por Super Usuário).

3.  **Desenvolvimento do Módulo de Categorias (1-2 semanas)**
    *   Modelagem do banco de dados para categorias (`id`, `name`, `type`, `budget`, `month`).
    *   API REST para criação, edição, exclusão e listagem de categorias.
    *   Associação de categorias a usuários/empresas.

## Fase 2: Core Financeiro e Lançamentos (4-6 semanas)

Esta fase implementa o coração do sistema: o registro e gestão de transações financeiras.

### Etapas:

1.  **Desenvolvimento do Módulo de Transações (3-4 semanas)**
    *   Modelagem do banco de dados para transações (`id`, `categoryId`, `amount`, `description`, `date`, `type`).
    *   API REST para registro de receitas e despesas (incluindo a distinção entre categorias planejadas e lançamentos pontuais).
    *   Endpoints para edição e exclusão de transações.
    *   Implementação de validações de dados em tempo real no backend para garantir a integridade dos lançamentos.

2.  **Integração Frontend-Backend (1-2 semanas)**
    *   Conexão do frontend React com as APIs de usuários, categorias e transações.
    *   Adaptação das telas de login, registro, gestão de usuários, categorias e lançamentos para consumir os dados do backend.
    *   Implementação de estados de loading e notificações (toast notifications) para feedback ao usuário.

## Fase 3: Relatórios e Visualizações Essenciais (3-5 semanas)

Esta fase foca em fornecer a visão financeira que o usuário busca, com relatórios e gráficos básicos.

### Etapas:

1.  **Desenvolvimento do Módulo de Relatórios (2-3 semanas)**
    *   API REST para geração de relatórios financeiros básicos (receitas, despesas, lucro/prejuízo) por período (mensal, anual).
    *   Implementação de filtros por categoria e tipo (receita/despesa).
    *   Lógica para segregação de categorias planejadas e lançamentos pontuais nos relatórios.

2.  **Implementação de Gráficos e Dashboard (1-2 semanas)**
    *   Adaptação do dashboard existente para exibir dados do backend.
    *   Implementação de gráficos de pizza para receitas/despesas e gráficos de linha para tendências financeiras (utilizando SVG nativo conforme o projeto).
    *   Conexão dos filtros do frontend com as APIs de relatórios para atualização dinâmica dos gráficos.

3.  **Funcionalidade de Exportação (0.5-1 semana)**
    *   Implementação da exportação de relatórios para CSV (formato mais simples para MVP).

## Fase 4: Testes e Preparação para Deploy (2-3 semanas)

Esta fase garante a qualidade do sistema e o prepara para ser disponibilizado.

### Etapas:

1.  **Testes Unitários e de Integração (1-2 semanas)**
    *   Escrita de testes unitários para as principais funções do backend (autenticação, transações, relatórios).
    *   Escrita de testes de integração para verificar a comunicação entre os módulos do backend e com o banco de dados.
    *   Foco na cobertura de testes para evitar valores incorretos que impactem a visão da empresa.

2.  **Testes End-to-End (E2E) e de Usabilidade (0.5-1 semana)**
    *   Criação de cenários de teste E2E para os fluxos críticos do usuário (login, registro de transação, visualização de relatório).
    *   Testes de usabilidade para garantir que a interface seja intuitiva e atenda às necessidades do usuário PME.

3.  **Otimização e Refatoração (0.5 semana)**
    *   Revisão de código para otimização de performance e legibilidade.
    *   Correção de bugs identificados durante os testes.

## Total Estimado para MVP: 13-20 semanas (aproximadamente 3 a 5 meses)

Este cronograma é uma estimativa e pode ser ajustado com base na velocidade da equipe, na complexidade real de cada funcionalidade e na priorização contínua. O foco é entregar um produto funcional e valioso para PMEs no menor tempo possível.

