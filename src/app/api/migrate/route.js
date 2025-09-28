import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    console.log("Iniciando migração do banco de dados...");
    
    // Executar migrações do Prisma
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
    
    console.log("Saída da migração:", stdout);
    if (stderr) {
      console.log("Erros/warnings:", stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: "Migrações executadas com sucesso",
      output: stdout,
      warnings: stderr
    });
    
  } catch (error) {
    console.error("Erro ao executar migrações:", error);
    return NextResponse.json(
      { 
        error: "Erro ao executar migrações", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return NextResponse.json({
    message: "Use POST para executar migrações",
    info: "Esta API executa 'npx prisma migrate deploy' para criar as tabelas no banco"
  });
}