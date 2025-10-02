#!/usr/bin/env node

// Script direto para limpar correções
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Limpando correções de teste...');
    
    const totalAntes = await prisma.correcaoItem.count();
    console.log(`📊 Correções encontradas: ${totalAntes}`);
    
    if (totalAntes > 0) {
      const resultado = await prisma.correcaoItem.deleteMany({});
      console.log(`✅ ${resultado.count} correções removidas!`);
    } else {
      console.log('✅ Nenhuma correção para remover.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();