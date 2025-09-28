import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { hasPermission } from "../../lib/permissoes";
import {
  PermissaoService,
  AuditoriaService,
} from "../../../lib/services.js";
import { obterIP } from "../../lib/auditoria";

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
    console.log(
      `[DEBUG] Verificando acesso para inventário: ${inventarioNome}`
    );
    console.log(`[DEBUG] Email do usuário: ${session.user.email}`);

    // Verificar permissões usando PostgreSQL
    const permissionResult = await hasPermission(
      inventarioNome,
      session.user.email
    );

    console.log(`[DEBUG] Resultado da verificação:`, permissionResult);

    // Log de auditoria para acesso (autorizado ou negado)
    await AuditoriaService.log(
      permissionResult.hasAccess
        ? "ACESSO_INVENTARIO_AUTORIZADO"
        : "ACESSO_INVENTARIO_NEGADO",
      session.user,
      {
        ip: obterIP(request),
        inventario: inventarioNome,
        isOwner: permissionResult.isOwner,
        hasAccess: permissionResult.hasAccess,
        userAgent: request.headers.get("user-agent") || "N/A",
      },
      inventarioNome
    );

    return NextResponse.json({
      hasAccess: permissionResult.hasAccess,
      isOwner: permissionResult.isOwner,
    });
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);

    await AuditoriaService.log("ERRO_VERIFICACAO_ACESSO", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      erro: error.message,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: "Erro ao verificar permissões." },
      { status: 500 }
    );
  }
}
