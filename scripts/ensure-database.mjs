#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureDatabase() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    // Verificar se a tabela correcoes_item existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'correcoes_item'
      );
    `;

    if (!tableExists[0]?.exists) {
      console.log('❌ Tabela correcoes_item não encontrada. Criando...');
      
      // Criar a tabela manualmente
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "public"."correcoes_item" (
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

      // Adicionar foreign keys se não existirem
      try {
        await prisma.$executeRaw`
          ALTER TABLE "public"."correcoes_item" 
          ADD CONSTRAINT "correcoes_item_inventarioId_fkey" 
          FOREIGN KEY ("inventarioId") REFERENCES "public"."inventarios"("id") 
          ON DELETE RESTRICT ON UPDATE CASCADE;
        `;
      } catch (e) {
        // Constraint já existe
      }

      try {
        await prisma.$executeRaw`
          ALTER TABLE "public"."correcoes_item" 
          ADD CONSTRAINT "correcoes_item_inventarianteId_fkey" 
          FOREIGN KEY ("inventarianteId") REFERENCES "public"."usuarios"("id") 
          ON DELETE RESTRICT ON UPDATE CASCADE;
        `;
      } catch (e) {
        // Constraint já existe
      }

      console.log('✅ Tabela correcoes_item criada com sucesso!');
    } else {
      console.log('✅ Tabela correcoes_item já existe.');
    }

    // Testar se consegue fazer uma query
    const count = await prisma.correcaoItem.count();
    console.log(`✅ Banco de dados OK. Correções encontradas: ${count}`);

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureDatabase();