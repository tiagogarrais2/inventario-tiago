-- CreateTable
CREATE TABLE "public"."correcoes_item" (
    "id" TEXT NOT NULL,
    "inventarioId" TEXT NOT NULL,
    "numeroItemOriginal" TEXT NOT NULL,
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
    "inventarianteId" TEXT NOT NULL,
    "dataCorrecao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correcoes_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."correcoes_item" ADD CONSTRAINT "correcoes_item_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."correcoes_item" ADD CONSTRAINT "correcoes_item_inventarianteId_fkey" FOREIGN KEY ("inventarianteId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
