import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  InventarioService,
  ItemInventarioService,
  PermissaoService,
  AuditoriaService,
  CorrecaoService,
} from "../../../lib/services.js";

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
    // Buscar inventário no banco de dados
    const inventario = await InventarioService.findByName(nomeInventario);

    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    // Verificar permissões de acesso ao inventário
    const hasAccess = await PermissaoService.canAccessInventario(
      session.user.email,
      inventario.nome
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Você não tem permissão para acessar este inventário.",
        },
        { status: 403 }
      );
    }

    // Se foi solicitado um tombo específico, buscar apenas esse item
    if (tombo) {
      let item;
      try {
        item = await ItemInventarioService.findByNumero(
          nomeInventario,
          tombo
        );

        if (!item) {
          return NextResponse.json(
            { error: "Item não encontrado." },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error(`Erro ao buscar item:`, error);
        return NextResponse.json(
          { error: `Erro interno: ${error.message}` },
          { status: 500 }
        );
      }

      // Verificar se o item tem correções
      const temCorrecoes = await CorrecaoService.hasCorrections(
        inventario.nome,
        tombo
      );
      const totalCorrecoes = temCorrecoes
        ? await CorrecaoService.findByNumeroOriginal(inventario.nome, tombo)
        : [];

      // Adicionar informações de correção ao item
      const itemComCorrecoes = {
        ...item,
        temCorrecoes,
        totalCorrecoes: totalCorrecoes.length,
        ultimaCorrecao:
          totalCorrecoes.length > 0 ? totalCorrecoes[0].dataCorrecao : null,
      };

      // Registrar acesso ao item no log de auditoria
      await AuditoriaService.log(
        "search_item",
        session.user,
        { tombo: tombo },
        inventario.nome
      );

      return NextResponse.json(itemComCorrecoes);
    }

    // Retornar todos os itens do inventário
    const itens = await ItemInventarioService.listByInventario(inventario.nome);

    // Adicionar informações de correção para cada item
    const itensComCorrecoes = await Promise.all(
      itens.map(async (item) => {
        const temCorrecoes = await CorrecaoService.hasCorrections(
          inventario.nome,
          item.numero
        );
        const totalCorrecoes = temCorrecoes
          ? await CorrecaoService.findByNumeroOriginal(
              inventario.nome,
              item.numero
            )
          : [];

        return {
          ...item,
          temCorrecoes,
          totalCorrecoes: totalCorrecoes.length,
          ultimaCorrecao:
            totalCorrecoes.length > 0
              ? totalCorrecoes[totalCorrecoes.length - 1].dataCorrecao
              : null,
        };
      })
    );

    // Registrar acesso ao inventário no log de auditoria
    await AuditoriaService.log(
      "view_inventory",
      session.user,
      { total_items: itens.length },
      inventario.nome
    );

    return NextResponse.json(itensComCorrecoes);
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
