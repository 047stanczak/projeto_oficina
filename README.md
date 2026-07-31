# Oficina - Gestão Inteligente de Custos e Estoque

Sistema para gestão de custos, estoque e precificação de produtos em uma oficina mecânica, com ingestão de XML de nota fiscal e apoio para análise operacional via dashboard, regras de precificação, simulação e relatórios.

## Stack atual

- Backend: Flask
- Frontend: React + Vite + TypeScript
- Banco de dados: PostgreSQL
- Conteinerização: Docker Compose

## Estrutura do repositório

```text
projeto_oficina/
├── backend/                 # API Flask e serviços do domínio
│   ├── controllers/
│   ├── models/
│   ├── repository/
│   └── services/
├── frontend/                # Aplicação React com interface administrativa
│   └── src/
├── infra/
│   └── postgres/
│       └── init.sql         # Inicialização do schema do banco
├── docs/                    # XMLs de exemplo para importação
└── README.md
```

## Principais capacidades

- Importação e processamento de XML da NF-e
- Cadastro e atualização de produtos
- Gestão de regras de precificação
- Dashboard operacional com indicadores
- Simulador de cenários
- Geração de relatórios
- Persistência de histórico de compra e movimentação de estoque

## Como executar

### 1. Preparar as variáveis de ambiente

No diretório raiz, crie um arquivo `.env` com as variáveis abaixo:

```env
DB_NAME=oficina
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
BACKEND_PORT=5000
FRONTEND_PORT=8080
GEMINI_API_KEY=sua_chave
```

### 2. Subir os containers

```bash
docker compose -f infra/docker-compose.yml up --build
```

### 3. Acessar a aplicação

- Frontend: http://localhost:8080
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432

## Observações de execução

- O banco é criado automaticamente pela inicialização do container PostgreSQL.
- O script de bootstrap está em `infra/postgres/init.sql`.
- A pasta `docs/` contém exemplos de XML para testes e validação do fluxo de importação.

## Fluxo principal

1. O usuário importa um XML de NF-e.
2. O backend extrai os produtos e dados relevantes do documento.
3. A interface apresenta os itens para análise e aprovação.
4. Os dados são persistidos em banco com atualização de estoque, histórico e regras de negócio.

## Comandos úteis

### Parar a stack

```bash
docker compose -f infra/docker-compose.yml down
```

### Remover volumes persistidos

```bash
docker compose -f infra/docker-compose.yml down -v
```

## Desenvolvimento local

Para rodar apenas o backend em modo local:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Para rodar o frontend em desenvolvimento:

```bash
cd frontend
npm install
npm run dev
```

## Conceito do projeto

O projeto atua como uma camada de automação operacional para o processo de entrada de produtos de nota fiscal, trazendo controle financeiro, rastreabilidade e apoio de decisão para a gestão da oficina.
