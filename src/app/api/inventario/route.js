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
  const tombo = searchParams.get("tombo");

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

    // Se não encontrar diretamente, buscar pasta que termina com o nome
    if (!fs.existsSync(path.join(baseDir, nomePasta))) {
      const pastas = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((pasta) => pasta.endsWith(`-${nomeInventario}`));

      if (pastas.length === 0) {
        return NextResponse.json(
          { error: "Inventário não encontrado." },
          { status: 404 }
        );
      }

      nomePasta = pastas[0];
    }

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

    const inventarioPath = path.join(baseDir, nomePasta, "inventario.json");

    if (!fs.existsSync(inventarioPath)) {
      return NextResponse.json(
        { error: "Arquivo de inventário não encontrado." },
        { status: 404 }
      );
    }

    const inventarioData = JSON.parse(fs.readFileSync(inventarioPath, "utf8"));

    // Se foi solicitado um tombo específico, buscar apenas esse item
    if (tombo) {
      const item = inventarioData.find(
        (item) => String(item["NUMERO"]) === String(tombo)
      );
      if (!item) {
        return NextResponse.json(
          { error: "Item não encontrado." },
          { status: 404 }
        );
      }
      return NextResponse.json(item);
    }

    // Retornar todo o inventário
    return NextResponse.json(inventarioData);
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
