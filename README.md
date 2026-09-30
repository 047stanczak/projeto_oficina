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
DB_NAME=oficina_db
DB_USER=postgres
DB_PASSWORD=<senha forte>
APP_DB_USER=oficina_app
APP_DB_PASSWORD=<outra senha forte>
FRONTEND_PORT=8080
GEMINI_API_KEY=sua_chave
TLS_SAN=DNS:localhost,IP:127.0.0.1,IP:<ip-do-servidor>
SECRET_KEY=<gere com: python -c "import secrets; print(secrets.token_hex(32))">
COOKIE_SECURE=1
```

### 2. Subir os containers

```bash
docker compose -f infra/docker-compose.yml up --build
```

### 3. Criar o primeiro administrador

Não existe cadastro público nem senha padrão: sem este passo ninguém consegue entrar.

```bash
docker compose -f infra/docker-compose.yml exec -it backend python create_admin.py
```

O script pede usuário e senha (10 a 128 caracteres). Rodá-lo de novo para o mesmo usuário redefine a senha.
Os demais usuários são criados pelo administrador na tela **Usuários**.

### 4. Acessar a aplicação

- Frontend: https://localhost:8080 (certificado autoassinado: o navegador mostra um aviso na primeira vez)
- Backend e PostgreSQL não são publicados no host: só o frontend (nginx) fica exposto e faz proxy de `/api`.

## Perfis de acesso

| Ação | Administrador | Membro |
|---|---|---|
| Ver dashboard, produtos, relatórios; usar o simulador | sim | sim |
| Importar NF-e, confirmar custos, alterar preço e estoque mínimo de um produto | sim | sim |
| Consultar preço de mercado (limite de 5/min por usuário) | sim | sim |
| Criar/editar regras de precificação e estoque mínimo global | sim | não |
| Gerenciar usuários | sim | não |

- A sessão dura 8 horas e é validada no banco a cada requisição: desativar um usuário ou trocar sua senha encerra as sessões dele na hora.
- Login limitado a 10 tentativas por minuto por IP e 10 a cada 15 minutos por conta.
- Os contadores do limite ficam em memória, por isso o backend roda com 1 worker do gunicorn.
- `COOKIE_SECURE=0` só deve ser usado em desenvolvimento local sem HTTPS.

## Observações de execução

- O certificado TLS é gerado na primeira subida e guardado no volume `certs_data`. Se o IP/nome de acesso mudar, altere `TLS_SAN` e rode `docker volume rm oficina_certs_data` para gerar outro.
- O banco é criado automaticamente pela inicialização do container PostgreSQL.
- O script de bootstrap está em `infra/postgres/init.sql`.
- Para bancos que já existem, aplique uma vez, como superusuário, as migrações (elas preservam os dados):
  `infra/postgres/migrations/001_add_min_stock.sql` e
  `psql -U postgres -d oficina_db -v app_user=<APP_DB_USER> -f infra/postgres/migrations/002_users.sql`.
- Testes do backend: `pip install -r backend/requirements.txt -r backend/requirements-dev.txt` e, em `backend/`, `python -m pytest`.
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

## Integrantes

- José Lorico Stanczak Junior
- Guilherme Turkot
- Anthony Riam Rodrigues
