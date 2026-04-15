# Korp ERP - Sistema de Emissão de Notas Fiscais

Projeto técnico desenvolvido para o processo seletivo da Korp ERP (Viasoft).

## 🚀 Tecnologias Utilizadas

### Frontend
- Angular 21
- Angular Material (componentes visuais)
- RxJS (gerenciamento de requisições HTTP com Observables)

### Backend
- Go (Golang)
- Gin Framework (rotas e middlewares)
- pgx/v5 (driver PostgreSQL)

### Banco de Dados
- PostgreSQL 15 (via Docker)

## 🏗️ Arquitetura

O sistema foi desenvolvido com arquitetura de microsserviços:

- **Serviço de Estoque** (porta 8081) — gerencia produtos e saldos
- **Serviço de Faturamento** (porta 8082) — gerencia notas fiscais

## 📋 Funcionalidades

- Cadastro de produtos (código, descrição, saldo)
- Cadastro de notas fiscais com numeração sequencial
- Inclusão de múltiplos produtos em uma nota
- Impressão de notas fiscais (altera status para Fechada e desconta saldo dos produtos)
- Bloqueio de impressão para notas com status diferente de Aberta
- Tratamento de falhas entre microsserviços

## ⚙️ Como Rodar o Projeto

### Pré-requisitos
- Node.js e Angular CLI instalados
- Go instalado
- Docker Desktop instalado e rodando
- PostgreSQL instalado

### 1. Banco de Dados
```bash
docker-compose up -d
```

### 2. Serviço de Estoque
```bash
cd backend/estoque
go run main.go
```

### 3. Serviço de Faturamento
```bash
cd backend/faturamento
go run main.go
```

### 4. Frontend
```bash
cd frontend/app
ng serve
```

Acesse: http://localhost:4200

## 🔧 Detalhamento Técnico

### Ciclos de Vida do Angular utilizados
- `ngOnInit` — carregamento inicial dos dados em todos os componentes

### RxJS
- `Observable` — utilizado em todas as requisições HTTP
- `subscribe` com `next` e `error` — tratamento de sucesso e falha nas requisições

### Bibliotecas Angular
- `@angular/material` — componentes visuais (tabelas, botões, formulários, snackbar)
- `@angular/common/http` — requisições HTTP via HttpClient
- `@angular/forms` — formulários com FormsModule e NgModel

### Gerenciamento de Dependências no Go
- `go.mod` e `go.sum` — gerenciamento de módulos e dependências
- `go get` — instalação de pacotes

### Framework Go
- **Gin** — framework HTTP para criação das rotas REST
- **pgx/v5** — driver nativo PostgreSQL com suporte a SCRAM-SHA-256

### Tratamento de Erros no Backend
- Verificação de status da nota antes de imprimir
- Verificação de saldo disponível antes de descontar
- Retorno de códigos HTTP adequados (400, 404, 500)
- Comunicação entre microsserviços com verificação de falha

## 👩‍💻 Desenvolvido por
Ana Carolina Ribeiro Santos