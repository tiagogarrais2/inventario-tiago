import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { logAuditoria, obterIP } from "../../lib/auditoria";
import { InventarioService, AuditoriaService } from "../../../lib/services.js";

export async function GET(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    // Log de tentativa de acesso não autorizado
    await AuditoriaService.log("ACESSO_NEGADO_LISTAGEM", null, {
      ip: obterIP(request),
      motivo: "Usuario nao autenticado",
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    // Busca inventários que o usuário tem acesso (proprietário ou com permissão)
    const inventarios = await InventarioService.listUserInventarios(
      session.user.email
    );

    // Formata os dados para compatibilidade com a interface existente
    const pastasComArquivos = inventarios.map((inv) => inv.nome);

    // Log de auditoria para acesso aos dados sensíveis
    await AuditoriaService.log("ACESSO_LISTAGEM_INVENTARIOS", session.user, {
      ip: obterIP(request),
      totalInventarios: inventarios.length,
      inventarios: pastasComArquivos,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    console.log(
      `[ACESSO_DADOS] ${session.user?.name || session.user?.email} acessou a listagem de inventários - Total: ${inventarios.length} inventários`
    );

    return new Response(
      JSON.stringify({
        pastas: pastasComArquivos,
        inventarios: inventarios.map((inv) => ({
          nome: inv.nome,
          nomeExibicao: inv.nomeExibicao,
          proprietario: inv.proprietario.nome,
          totalItens: inv._count.itens,
          createdAt: inv.createdAt,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log de erro
    await AuditoriaService.log("ERRO_LISTAGEM_INVENTARIOS", session.user, {
      ip: obterIP(request),
      erro: error.message,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    console.error("Erro ao listar inventários:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
