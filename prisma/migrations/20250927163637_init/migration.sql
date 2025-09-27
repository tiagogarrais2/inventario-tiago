-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeExibicao" TEXT NOT NULL,
    "proprietarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_inventario" (
    "id" TEXT NOT NULL,
    "inventarioId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT,
    "ed" TEXT,
    "conta_contabil" TEXT,
    "descricao" TEXT,
    "rotulos" TEXT,
    "carga_atual" TEXT,
    "setor_responsavel" TEXT,
    "campus_carga" TEXT,
    "carga_contabil" TEXT,
    "valor_aquisicao" TEXT,
    "valor_depreciado" TEXT,
    "numero_nota_fiscal" TEXT,
    "numero_serie" TEXT,
    "data_entrada" TEXT,
    "data_carga" TEXT,
    "fornecedor" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "sala" TEXT,
    "setor" TEXT,
    "estado_conservacao" TEXT,
    "dataInventario" TIMESTAMP(3),
    "inventarianteId" TEXT,
    "sala_encontrada" TEXT,
    "status_inventario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salas" (
    "id" TEXT NOT NULL,
    "inventarioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cabecalhos_inventario" (
    "id" TEXT NOT NULL,
    "inventarioId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cabecalhos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissoes" (
    "id" TEXT NOT NULL,
    "inventarioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acao" TEXT NOT NULL,
    "usuarioId" TEXT,
    "inventarioId" TEXT,
    "detalhes" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inventarios_nome_key" ON "public"."inventarios"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "itens_inventario_inventarioId_numero_key" ON "public"."itens_inventario"("inventarioId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "salas_inventarioId_nome_key" ON "public"."salas"("inventarioId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "cabecalhos_inventario_inventarioId_campo_key" ON "public"."cabecalhos_inventario"("inventarioId", "campo");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_inventarioId_usuarioId_key" ON "public"."permissoes"("inventarioId", "usuarioId");

-- AddForeignKey
ALTER TABLE "public"."inventarios" ADD CONSTRAINT "inventarios_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_inventario" ADD CONSTRAINT "itens_inventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_inventario" ADD CONSTRAINT "itens_inventario_inventarianteId_fkey" FOREIGN KEY ("inventarianteId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salas" ADD CONSTRAINT "salas_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cabecalhos_inventario" ADD CONSTRAINT "cabecalhos_inventario_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permissoes" ADD CONSTRAINT "permissoes_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permissoes" ADD CONSTRAINT "permissoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
