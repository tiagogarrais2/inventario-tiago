import { NextResponse } from "next/server";
import prisma from "../../../lib/db.js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST() {
  // Verificar autenticação - só admin
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== 'tiagoarraisholanda@gmail.com') {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    // Verificar se a tabela já existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'correcoes_item'
      );
    `;

    if (tableExists[0]?.exists) {
      return NextResponse.json({
        message: "Tabela correcoes_item já existe",
        status: "already_exists"
      });
    }

    // Criar a tabela manualmente
    await prisma.$executeRaw`
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
    `;

    // Adicionar foreign keys
    await prisma.$executeRaw`
      ALTER TABLE "public"."correcoes_item" 
      ADD CONSTRAINT "correcoes_item_inventarioId_fkey" 
      FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `;

    await prisma.$executeRaw`
      ALTER TABLE "public"."correcoes_item" 
      ADD CONSTRAINT "correcoes_item_inventarianteId_fkey" 
      FOREIGN KEY ("inventarianteId") REFERENCES "public"."usuarios"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `;

    return NextResponse.json({
      message: "Tabela correcoes_item criada com sucesso",
      status: "created"
    });

  } catch (error) {
    console.error("Erro ao criar tabela:", error);
    return NextResponse.json({
      error: error.message,
      status: "error"
    }, { status: 500 });
  }
}