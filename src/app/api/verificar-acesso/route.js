import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { hasPermission } from "../../lib/permissoes";
import { logAuditoria, obterIP } from "../../lib/auditoria";
import fs from "fs";
import path from "path";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const inventarioNome = url.searchParams.get("inventario");

  if (!inventarioNome) {
    return NextResponse.json(
      { error: "Nome do inventário é obrigatório." },
      { status: 400 }
    );
  }

  try {
    // Resolver nome da pasta (mesmo lógica das outras APIs)
    const baseDir = path.join(process.cwd(), "public");
    let nomePasta = inventarioNome;

    // Se não encontrar diretamente, buscar pasta que termina com o nome
    if (!fs.existsSync(path.join(baseDir, nomePasta))) {
      const pastas = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((pasta) => pasta.endsWith(`-${inventarioNome}`));

      if (pastas.length === 0) {
        return NextResponse.json(
          { error: "Inventário não encontrado." },
          { status: 404 }
        );
      }

      nomePasta = pastas[0];
    }

    const permissionResult = await hasPermission(nomePasta, session.user.email);

    // Log de auditoria para acesso (autorizado ou negado)
    await logAuditoria(
      permissionResult.hasAccess
        ? "ACESSO_INVENTARIO_AUTORIZADO"
        : "ACESSO_INVENTARIO_NEGADO",
      session.user,
      {
        ip: obterIP(request),
        inventario: inventarioNome,
        isOwner: permissionResult.isOwner,
        hasAccess: permissionResult.hasAccess,
      }
    );

    return NextResponse.json({
      hasAccess: permissionResult.hasAccess,
      isOwner: permissionResult.isOwner,
    });
  } catch (error) {
    await logAuditoria("ERRO_VERIFICACAO_ACESSO", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      erro: error.message,
    });

    return NextResponse.json(
      { error: "Erro ao verificar permissões." },
      { status: 500 }
    );
  }
}
