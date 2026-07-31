CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    custo_atual DECIMAL(10, 2),
    preco_venda DECIMAL(10, 2),
    estoque INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historico_compras (
    id SERIAL PRIMARY KEY,
    produto_id INT REFERENCES produtos(id),
    custo_antigo DECIMAL(10, 2),
    custo_novo DECIMAL(10, 2),
    quantidade INT,
    nfe_id INT,
    data_compra TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20),
    serie VARCHAR(5),
    data_emissao DATE,
    fornecedor VARCHAR(255),
    arquivo_nome VARCHAR(255),
    total_nfe DECIMAL(12, 2),
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- produto_id NULL = regra padrão (global). produto_id preenchido = sobrescreve a global.
CREATE TABLE IF NOT EXISTS regras_precificacao (
    id SERIAL PRIMARY KEY,
    produto_id INT UNIQUE REFERENCES produtos(id),
    margem_percentual DECIMAL(5, 2) NOT NULL,
    imposto_percentual DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regra_global
    ON regras_precificacao ((produto_id IS NULL))
    WHERE produto_id IS NULL;

CREATE TABLE IF NOT EXISTS historico_precos (
    id SERIAL PRIMARY KEY,
    produto_id INT REFERENCES produtos(id),
    preco_antigo DECIMAL(10, 2),
    preco_novo DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultas_mercado (
    id SERIAL PRIMARY KEY,
    produto_id INT REFERENCES produtos(id),
    resposta TEXT,
    fontes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
