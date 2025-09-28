// Teste simples dos services
import { PrismaClient } from "@prisma/client";

async function test() {
  const prisma = new PrismaClient();

  try {
    console.log("Testando conexão com o banco...");
    await prisma.$connect();
    console.log("Conexão com o banco OK");

    await prisma.$disconnect();
    console.log("Teste concluído com sucesso");
  } catch (error) {
    console.error("Erro no teste:", error);
  }
}

test();
