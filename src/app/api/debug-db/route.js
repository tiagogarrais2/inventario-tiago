import { NextResponse } from "next/server";
import prisma from "../../../lib/db.js";

export async function GET() {
  try {
    // Verificar se a tabela correcoes_item existe
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'correcoes_item'
      );
    `;

    // Contar quantas correções existem
    let correcoesCount = 0;
    try {
      correcoesCount = await prisma.correcaoItem.count();
    } catch (error) {
      // Se a tabela não existir, count falhará
    }

    // Listar todas as tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    return NextResponse.json({
      database_status: "connected",
      correcoes_table_exists: result[0]?.exists || false,
      correcoes_count: correcoesCount,
      available_tables: tables,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        database_status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
