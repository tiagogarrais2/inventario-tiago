import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import {
  InventarioService,
  CorrecaoService,
  PermissaoService,
} from "@/lib/services";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Await params in Next.js 15
    const { inventario, numero } = await params;

    if (!inventario || !numero) {
      return NextResponse.json(
        { error: "Parâmetros inventario e numero são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe e o usuário tem permissão
    const inventarioObj = await InventarioService.findByName(inventario);
    if (!inventarioObj) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const temPermissao = await PermissaoService.canAccessInventario(
      session.user.email,
      inventario
    );

    if (!temPermissao) {
      return NextResponse.json(
        { error: "Sem permissão para acessar este inventário" },
        { status: 403 }
      );
    }

    // Buscar histórico de correções do item
    const correcoes = await CorrecaoService.findByNumeroOriginal(
      inventario,
      numero
    );

    // Criar HTML formatado para o usuário
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Histórico de Correções - Item ${numero}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .top-header {
            background: #fff;
            border-bottom: 1px solid #e0e0e0;
            padding: 15px 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .top-header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
            display: inline-block;
          }
          .top-header a {
            color: #007bff;
            text-decoration: none;
          }
          .top-header a:hover {
            text-decoration: underline;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
            margin-top: 20px;
            margin-bottom: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .correcao {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
          }
          .correcao-header {
            background-color: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
          }
          .correcao-content {
            padding: 20px;
          }
          .campo-alterado {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
          }
          .campo-nome {
            font-weight: bold;
            color: #856404;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .valor-original {
            color: #dc3545;
            font-style: italic;
          }
          .valor-novo {
            color: #28a745;
            font-weight: bold;
          }
          .observacoes {
            background-color: #e7f3ff;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin-top: 15px;
            border-radius: 0 4px 4px 0;
          }
          .observacoes h4 {
            margin: 0 0 10px 0;
            color: #0056b3;
          }
          .meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .sem-correcoes {
            text-align: center;
            color: #666;
            font-style: italic;
            margin: 40px 0;
          }
          .arrow {
            color: #666;
            margin: 0 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <!-- Cabeçalho de navegação -->
        <div class="top-header">
          <h1>
            <a href="/">Sistema Inventário Tiago</a>
            <span style="font-weight: normal; font-size: 16px; margin-left: 20px;">
              → <a href="/inventario/${inventario}">Voltar ao Inventário</a>
            </span>
          </h1>
        </div>
        
        <div class="container">
          <div class="header">
            <h1>📋 Histórico de Correções</h1>
            <p><strong>Item:</strong> ${numero} | <strong>Inventário:</strong> ${inventario}</p>
            <p>${correcoes.length} correção(ões) registrada(s)</p>
          </div>

          ${
            correcoes.length === 0
              ? `
            <div class="sem-correcoes">
              <p>Nenhuma correção foi registrada para este item.</p>
            </div>
          `
              : correcoes
                  .map((correcao, index) => {
                    const dataCorrecao = new Date(
                      correcao.createdAt
                    ).toLocaleString("pt-BR");

                    // Extrair diferenças das observações
                    let dadosCorrigidos = {};
                    let observacoesLimpas = correcao.observacoes || "";

                    // Verificar se há campos alterados nas observações
                    const regexCampos = /Campos alterados: (.+)/;
                    const match = observacoesLimpas.match(regexCampos);

                    if (match) {
                      // Remover a parte dos campos alterados das observações para exibição limpa
                      observacoesLimpas = observacoesLimpas
                        .replace(/\n\nCampos alterados:.+/, "")
                        .trim();

                      // Parse dos campos alterados
                      const camposTexto = match[1];
                      const campos = camposTexto.split(" | ");

                      campos.forEach((campo) => {
                        const [nome, valores] = campo.split(": ");
                        if (valores) {
                          const [original, novo] = valores.split(" → ");
                          dadosCorrigidos[nome] = {
                            original: original?.replace(/"/g, "") || "",
                            novo: novo?.replace(/"/g, "") || "",
                          };
                        }
                      });
                    }

                    return `
              <div class="correcao">
                <div class="correcao-header">
                  <div class="meta">
                    <strong>Correção #${index + 1}</strong> • 
                    ${dataCorrecao} • 
                    <strong>Por:</strong> ${correcao.inventariante?.nome || correcao.inventariante?.email || "Usuário não identificado"}
                  </div>
                </div>
                <div class="correcao-content">
                  ${
                    Object.keys(dadosCorrigidos).length > 0
                      ? Object.entries(dadosCorrigidos)
                          .map(
                            ([campo, valor]) => `
                      <div class="campo-alterado">
                        <div class="campo-nome">${campo}</div>
                        <div>
                          <span class="valor-original">Valor original:</span> "${valor?.original || "Não informado"}"
                          <span class="arrow">→</span>
                          <span class="valor-novo">Novo valor:</span> "${valor?.novo || "Não informado"}"
                        </div>
                      </div>
                    `
                          )
                          .join("")
                      : '<div class="campo-alterado"><p><em>Nenhum campo específico foi registrado nesta correção.</em></p></div>'
                  }
                  
                  ${
                    observacoesLimpas
                      ? `
                    <div class="observacoes">
                      <h4>📝 Observações</h4>
                      <p>${observacoesLimpas}</p>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            `;
                  })
                  .join("")
          }
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico de correções:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
