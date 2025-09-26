import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { hasPermission } from "../../lib/permissoes";

export async function GET(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const nomeInventario = searchParams.get("inventario");

  if (!nomeInventario) {
    return NextResponse.json(
      { error: "Parâmetro 'inventario' é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const baseDir = path.join(process.cwd(), "public");

    // Verificar se a pasta existe diretamente
    let nomePasta = nomeInventario;
    console.log(
      "[DEBUG] Testando pasta direta:",
      path.join(baseDir, nomePasta)
    );

    // Se não encontrar diretamente, buscar pasta que termina com o nome
    if (!fs.existsSync(path.join(baseDir, nomePasta))) {
      console.log(
        "[DEBUG] Pasta não encontrada diretamente, buscando por sufixo..."
      );
      const pastas = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((pasta) => pasta.endsWith(`-${nomeInventario}`));

      console.log("[DEBUG] Pastas encontradas:", pastas);

      if (pastas.length === 0) {
        return NextResponse.json(
          { error: "Inventário não encontrado." },
          { status: 404 }
        );
      }

      nomePasta = pastas[0];
    }

    console.log("[DEBUG] Pasta final selecionada:", nomePasta);

    // Verificar permissões de acesso ao inventário
    const permissao = await hasPermission(nomePasta, session.user.email);

    if (!permissao.hasAccess) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Você não tem permissão para acessar este inventário.",
        },
        { status: 403 }
      );
    }

    const salasPath = path.join(baseDir, nomePasta, "salas.json");

    if (!fs.existsSync(salasPath)) {
      return NextResponse.json(
        { error: "Arquivo de salas não encontrado." },
        { status: 404 }
      );
    }

    const salasData = JSON.parse(fs.readFileSync(salasPath, "utf8"));

    return NextResponse.json(salasData);
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
