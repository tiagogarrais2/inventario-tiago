import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { hasPermission } from "../../../lib/permissoes";
import { obterIP } from "../../../lib/auditoria";
import {
  UsuarioService,
  InventarioService,
  AuditoriaService,
} from "../../../../lib/services.js";

export async function GET(request, { params }) {
  console.log("[INVENTARIO_DASHBOARD] Iniciando busca de dados...");

  // Verificar autenticação
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;

  if (!session) {
    await AuditoriaService.log("ACESSO_NEGADO_INVENTARIO_DASHBOARD", null, {
      ip: obterIP(request),
      motivo: "Usuario nao autenticado",
      inventario: resolvedParams.nome,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const nomeInventario = resolvedParams.nome;
    const usuario = await UsuarioService.findOrCreateFromSession(session.user);

    // Verificar se o usuário tem acesso ao inventário
    const inventario = await InventarioService.findByName(nomeInventario);

    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    // Verificar se tem permissão usando a mesma lógica de verificar-acesso
    const temPermissao = await hasPermission(
      nomeInventario,
      session.user.email
    );

    if (!temPermissao.hasAccess) {
      await AuditoriaService.log(
        "ACESSO_NEGADO_INVENTARIO_DASHBOARD",
        session.user,
        {
          ip: obterIP(request),
          motivo: "Usuario sem permissao",
          inventario: nomeInventario,
          userAgent: request.headers.get("user-agent") || "N/A",
        }
      );

      return NextResponse.json(
        { error: "Você não tem permissão para acessar este inventário." },
        { status: 403 }
      );
    }

    // Obter estatísticas detalhadas do inventário
    const [
      estatisticasGerais,
      estatisticasPorSala,
      atividadeRecente,
      correcoesResumo,
    ] = await Promise.all([
      InventarioService.getEstatisticasInventario(inventario.id),
      InventarioService.getEstatisticasPorSala(inventario.id),
      AuditoriaService.getAtividadeRecenteInventario(inventario.id, 15),
      InventarioService.getResumoCorrecoes(inventario.id),
    ]);

    // Log do acesso
    await AuditoriaService.log("ACESSO_INVENTARIO_DASHBOARD", session.user, {
      ip: obterIP(request),
      inventario: nomeInventario,
      isOwner: temPermissao.isOwner,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json({
      inventario: {
        nome: inventario.nome,
        nomeExibicao: inventario.nomeExibicao,
        proprietario: inventario.proprietario.nome,
        criadoEm: inventario.createdAt,
        isOwner: temPermissao.isOwner,
      },
      estatisticas: estatisticasGerais,
      salas: estatisticasPorSala,
      atividade: atividadeRecente,
      correcoes: correcoesResumo,
    });
  } catch (error) {
    console.error("[INVENTARIO_DASHBOARD] Erro ao buscar dados:", error);

    // Log do erro
    await AuditoriaService.log("ERRO_INVENTARIO_DASHBOARD", session.user, {
      ip: obterIP(request),
      erro: error.message,
      inventario: resolvedParams.nome,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
