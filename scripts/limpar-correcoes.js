#!/usr/bin/env node

// Script para limpar apenas as correções de teste do banco
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function limparCorrecoes() {
  try {
    console.log("🧹 Iniciando limpeza das correções...");

    // Contar correções antes
    const totalAntes = await prisma.correcaoItem.count();
    console.log(`📊 Total de correções encontradas: ${totalAntes}`);

    if (totalAntes === 0) {
      console.log("✅ Nenhuma correção encontrada para limpar.");
      return;
    }

    // Confirmar antes de deletar
    console.log("⚠️  Tem certeza que deseja deletar TODAS as correções?");
    console.log("   Os dados originais dos itens NÃO serão afetados.");
    console.log("   Pressione Ctrl+C para cancelar ou Enter para continuar...");

    // Aguardar confirmação
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve());
    });

    // Deletar todas as correções
    const resultado = await prisma.correcaoItem.deleteMany({});

    console.log(`✅ ${resultado.count} correções removidas com sucesso!`);
    console.log("📋 Dados originais dos itens preservados.");
  } catch (error) {
    console.error("❌ Erro ao limpar correções:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Executar
limparCorrecoes();
