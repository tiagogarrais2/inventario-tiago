import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { logAuditoria, obterIP } from "../../lib/auditoria";
import { isOwner } from "../../lib/permissoes";
import { promises as fs } from "fs";
import path from "path";

// GET - Listar permissões de um inventário
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

  // Verificar se é o proprietário
  if (!(await isOwner(inventarioNome, session.user.email))) {
    await logAuditoria("ACESSO_NEGADO_PERMISSOES", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      motivo: "Usuario nao e proprietario",
    });

    return NextResponse.json(
      {
        error:
          "Acesso negado. Apenas o proprietário pode gerenciar permissões.",
      },
      { status: 403 }
    );
  }

  try {
    const permissoesPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "permissoes.json"
    );

    let permissoes = [];
    try {
      const data = await fs.readFile(permissoesPath, "utf8");
      permissoes = JSON.parse(data);
    } catch (error) {
      // Arquivo não existe ainda, retorna array vazio
    }

    await logAuditoria("CONSULTA_PERMISSOES", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      totalPermissoes: permissoes.length,
    });

    return NextResponse.json({ permissoes });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar permissões." },
      { status: 500 }
    );
  }
}

// POST - Adicionar nova permissão
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const { inventarioNome, emailUsuario } = await request.json();

  if (!inventarioNome || !emailUsuario) {
    return NextResponse.json(
      { error: "Nome do inventário e email do usuário são obrigatórios." },
      { status: 400 }
    );
  }

  // Verificar se é o proprietário
  if (!(await isOwner(inventarioNome, session.user.email))) {
    await logAuditoria("TENTATIVA_ADICIONAR_PERMISSAO_NEGADA", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      emailAlvo: emailUsuario,
      motivo: "Usuario nao e proprietario",
    });

    return NextResponse.json(
      {
        error: "Acesso negado. Apenas o proprietário pode conceder permissões.",
      },
      { status: 403 }
    );
  }

  try {
    const permissoesPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "permissoes.json"
    );

    let permissoes = [];
    try {
      const data = await fs.readFile(permissoesPath, "utf8");
      permissoes = JSON.parse(data);
    } catch (error) {
      // Arquivo não existe, inicia com array vazio
    }

    // Verificar se usuário já tem permissão
    if (permissoes.find((p) => p.email === emailUsuario)) {
      return NextResponse.json(
        { error: "Usuário já possui acesso a este inventário." },
        { status: 400 }
      );
    }

    // Não pode dar permissão para si mesmo
    if (emailUsuario === session.user.email) {
      return NextResponse.json(
        { error: "Você já é o proprietário deste inventário." },
        { status: 400 }
      );
    }

    // Adicionar nova permissão
    const novaPermissao = {
      email: emailUsuario,
      concedidaPor: session.user.email,
      concedidaEm: new Date().toISOString(),
      ativa: true,
    };

    permissoes.push(novaPermissao);
    await fs.writeFile(permissoesPath, JSON.stringify(permissoes, null, 2));

    await logAuditoria("PERMISSAO_CONCEDIDA", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      emailAlvo: emailUsuario,
    });

    return NextResponse.json({
      message: "Permissão concedida com sucesso.",
      permissao: novaPermissao,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao conceder permissão." },
      { status: 500 }
    );
  }
}

// DELETE - Remover permissão
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const { inventarioNome, emailUsuario } = await request.json();

  if (!inventarioNome || !emailUsuario) {
    return NextResponse.json(
      { error: "Nome do inventário e email do usuário são obrigatórios." },
      { status: 400 }
    );
  }

  // Verificar se é o proprietário
  if (!(await isOwner(inventarioNome, session.user.email))) {
    await logAuditoria("TENTATIVA_REVOGAR_PERMISSAO_NEGADA", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      emailAlvo: emailUsuario,
      motivo: "Usuario nao e proprietario",
    });

    return NextResponse.json(
      {
        error: "Acesso negado. Apenas o proprietário pode revogar permissões.",
      },
      { status: 403 }
    );
  }

  try {
    const permissoesPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "permissoes.json"
    );

    let permissoes = [];
    try {
      const data = await fs.readFile(permissoesPath, "utf8");
      permissoes = JSON.parse(data);
    } catch (error) {
      return NextResponse.json(
        { error: "Nenhuma permissão encontrada." },
        { status: 404 }
      );
    }

    // Filtrar permissões removendo a do usuário especificado
    const permissoesAtualizadas = permissoes.filter(
      (p) => p.email !== emailUsuario
    );

    if (permissoes.length === permissoesAtualizadas.length) {
      return NextResponse.json(
        { error: "Usuário não possui acesso a este inventário." },
        { status: 404 }
      );
    }

    await fs.writeFile(
      permissoesPath,
      JSON.stringify(permissoesAtualizadas, null, 2)
    );

    await logAuditoria("PERMISSAO_REVOGADA", session.user, {
      ip: obterIP(request),
      inventario: inventarioNome,
      emailAlvo: emailUsuario,
    });

    return NextResponse.json({
      message: "Permissão revogada com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao revogar permissão." },
      { status: 500 }
    );
  }
}
