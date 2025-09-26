import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { logAuditoria, obterIP } from "../../lib/auditoria";

export async function GET(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    // Log de tentativa de acesso não autorizado
    await logAuditoria("ACESSO_NEGADO_LISTAGEM", null, {
      ip: obterIP(request),
      motivo: "Usuario nao autenticado",
    });

    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }
  const baseDir = path.join(process.cwd(), "public");
  let pastasComArquivos = [];

  try {
    const pastas = fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const pasta of pastas) {
      const cabecalhosPath = path.join(baseDir, pasta, "cabecalhos.json");
      const salasPath = path.join(baseDir, pasta, "salas.json");
      const inventarioPath = path.join(baseDir, pasta, "inventario.json");

      if (
        fs.existsSync(cabecalhosPath) &&
        fs.existsSync(salasPath) &&
        fs.existsSync(inventarioPath)
      ) {
        pastasComArquivos.push(pasta);
      }
    }

    // Log de auditoria para acesso aos dados sensíveis
    await logAuditoria("ACESSO_LISTAGEM_INVENTARIOS", session.user, {
      ip: obterIP(request),
      totalInventarios: pastasComArquivos.length,
      inventarios: pastasComArquivos,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    console.log(
      `[ACESSO_DADOS] ${session.user?.name || session.user?.email} acessou a listagem de inventários - Total: ${pastasComArquivos.length} inventários`
    );

    return new Response(
      JSON.stringify({
        pastas: pastasComArquivos,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log de erro
    await logAuditoria("ERRO_LISTAGEM_INVENTARIOS", session.user, {
      ip: obterIP(request),
      erro: error.message,
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
