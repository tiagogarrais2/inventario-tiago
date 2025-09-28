import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  PermissaoService,
  AuditoriaService,
  InventarioService,
  UsuarioService,
} from "../../../lib/services.js";

// GET - Listar permissões de um inventário
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inventario = searchParams.get("inventario");

  if (!inventario) {
    return NextResponse.json(
      { error: "Nome do inventário é obrigatório" },
      { status: 400 }
    );
  }

  try {
    // Verificar se o inventário existe
    const inventarioData = await InventarioService.findByName(inventario);
    if (!inventarioData) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é proprietário
    const usuario = await UsuarioService.findByEmail(session.user.email);
    if (!usuario || inventarioData.proprietarioId !== usuario.id) {
      await AuditoriaService.log(
        "ACESSO_NEGADO_PERMISSOES",
        session.user,
        { motivo: "Usuario nao e proprietario" },
        inventario
      );

      return NextResponse.json(
        { error: "Apenas o proprietário pode ver as permissões" },
        { status: 403 }
      );
    }

    // Listar permissões
    const permissoes = await PermissaoService.listByInventario(inventario);

    // Log da ação
    await AuditoriaService.log(
      "CONSULTA_PERMISSOES",
      session.user,
      { total: permissoes.length },
      inventario
    );

    return NextResponse.json({ permissoes });
  } catch (error) {
    console.error("Erro ao listar permissões:", error);

    await AuditoriaService.log(
      "ERRO_LISTAR_PERMISSOES",
      session.user,
      { erro: error.message },
      inventario
    );

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Adicionar nova permissão
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { inventarioNome, emailUsuario } = await request.json();

  if (!inventarioNome || !emailUsuario) {
    return NextResponse.json(
      { error: "Nome do inventário e email do usuário são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    // Verificar se o inventário existe
    const inventarioData = await InventarioService.findByName(inventarioNome);
    if (!inventarioData) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é proprietário
    const usuario = await UsuarioService.findByEmail(session.user.email);
    if (!usuario || inventarioData.proprietarioId !== usuario.id) {
      await AuditoriaService.log(
        "TENTATIVA_ADICIONAR_PERMISSAO_NEGADA",
        session.user,
        { emailAlvo: emailUsuario, motivo: "Usuario nao e proprietario" },
        inventarioNome
      );

      return NextResponse.json(
        { error: "Apenas o proprietário pode conceder permissões" },
        { status: 403 }
      );
    }

    // Não pode dar permissão para si mesmo
    if (emailUsuario === session.user.email) {
      return NextResponse.json(
        { error: "Você já é o proprietário deste inventário" },
        { status: 400 }
      );
    }

    // Buscar ou criar o usuário alvo
    let usuarioAlvo = await UsuarioService.findByEmail(emailUsuario);
    if (!usuarioAlvo) {
      // Criar usuário automaticamente se não existir
      usuarioAlvo = await UsuarioService.findOrCreateFromSession({
        email: emailUsuario,
        name: emailUsuario.split("@")[0], // Use a parte antes do @ como nome padrão
      });
    }

    // Verificar se já tem permissão
    const permissaoExistente = await PermissaoService.findByUserAndInventario(
      usuarioAlvo.id,
      inventarioData.id
    );

    if (permissaoExistente) {
      return NextResponse.json(
        { error: "Usuário já possui acesso a este inventário" },
        { status: 400 }
      );
    }

    // Criar nova permissão
    const novaPermissao = await PermissaoService.create({
      usuarioId: usuarioAlvo.id,
      inventarioId: inventarioData.id,
      concedidoPorId: usuario.id,
      tipo: "ACESSO",
    });

    await AuditoriaService.log(
      "PERMISSAO_CONCEDIDA",
      session.user,
      { emailAlvo: emailUsuario },
      inventarioNome
    );

    return NextResponse.json({
      message: "Permissão concedida com sucesso",
      permissao: {
        id: novaPermissao.id,
        email: emailUsuario,
        concedidaPor: session.user.email,
        concedidaEm: novaPermissao.criadoEm,
        ativa: true,
      },
    });
  } catch (error) {
    console.error("Erro ao conceder permissão:", error);

    await AuditoriaService.log(
      "ERRO_CONCEDER_PERMISSAO",
      session.user,
      { erro: error.message, emailAlvo: emailUsuario },
      inventarioNome
    );

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Remover permissão
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { inventarioNome, emailUsuario } = await request.json();

  if (!inventarioNome || !emailUsuario) {
    return NextResponse.json(
      { error: "Nome do inventário e email do usuário são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    // Verificar se o inventário existe
    const inventarioData = await InventarioService.findByName(inventarioNome);
    if (!inventarioData) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é proprietário
    const usuario = await UsuarioService.findByEmail(session.user.email);
    if (!usuario || inventarioData.proprietarioId !== usuario.id) {
      await AuditoriaService.log(
        "TENTATIVA_REVOGAR_PERMISSAO_NEGADA",
        session.user,
        { emailAlvo: emailUsuario, motivo: "Usuario nao e proprietario" },
        inventarioNome
      );

      return NextResponse.json(
        { error: "Apenas o proprietário pode revogar permissões" },
        { status: 403 }
      );
    }

    // Verificar se o usuário alvo existe
    const usuarioAlvo = await UsuarioService.findByEmail(emailUsuario);
    if (!usuarioAlvo) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se tem permissão
    const permissao = await PermissaoService.findByUserAndInventario(
      usuarioAlvo.id,
      inventarioData.id
    );

    if (!permissao) {
      return NextResponse.json(
        { error: "Usuário não possui acesso a este inventário" },
        { status: 404 }
      );
    }

    // Revogar permissão
    await PermissaoService.delete(permissao.id);

    await AuditoriaService.log(
      "PERMISSAO_REVOGADA",
      session.user,
      { emailAlvo: emailUsuario },
      inventarioNome
    );

    return NextResponse.json({
      message: "Permissão revogada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao revogar permissão:", error);

    await AuditoriaService.log(
      "ERRO_REVOGAR_PERMISSAO",
      session.user,
      { erro: error.message, emailAlvo: emailUsuario },
      inventarioNome
    );

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
