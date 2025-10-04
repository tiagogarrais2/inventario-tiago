import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { obterIP } from "../../lib/auditoria";
import {
  UsuarioService,
  InventarioService,
  AuditoriaService,
} from "../../../lib/services.js";

export async function GET(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    await AuditoriaService.log("ACESSO_NEGADO_DASHBOARD", null, {
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
    const usuario = await UsuarioService.findOrCreateFromSession(session.user);

    // Obter estatísticas gerais
    const [
      inventariosProprietario,
      inventariosComPermissao,
      estatisticasGerais,
      atividadeRecente,
    ] = await Promise.all([
      InventarioService.findByOwner(usuario.id),
      InventarioService.findByUser(usuario.id),
      InventarioService.getEstatisticasGerais(usuario.id),
      AuditoriaService.getAtividadeRecente(usuario.id, 10),
    ]);

    // Log do acesso
    await AuditoriaService.log("ACESSO_DASHBOARD", session.user, {
      ip: obterIP(request),
      totalInventarios:
        inventariosProprietario.length + inventariosComPermissao.length,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json({
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        criadoEm: usuario.createdAt,
      },
      inventarios: {
        proprietario: inventariosProprietario.length,
        comPermissao: inventariosComPermissao.length,
        total: inventariosProprietario.length + inventariosComPermissao.length,
      },
      estatisticas: estatisticasGerais,
      atividade: atividadeRecente,
    });
  } catch (error) {
    console.error("[DASHBOARD] Erro ao buscar dados:", error);

    // Log do erro
    await AuditoriaService.log("ERRO_DASHBOARD", session.user, {
      ip: obterIP(request),
      erro: error.message,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
