-- Adiciona colunas faltando em 'inventarios'
ALTER TABLE "inventarios"
  ADD COLUMN IF NOT EXISTS "import_format" TEXT,
  ADD COLUMN IF NOT EXISTS "import_mapping" JSONB,
  ADD COLUMN IF NOT EXISTS "cargo_proprietario" TEXT NOT NULL DEFAULT 'Servidor(a)';

-- Adiciona coluna faltando em 'itens_inventario'
ALTER TABLE "itens_inventario"
  ADD COLUMN IF NOT EXISTS "observacoes_inventario" TEXT;
