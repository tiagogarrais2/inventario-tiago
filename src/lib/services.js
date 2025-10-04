import prisma from "./db.js";

// Service para gerenciar usuários
class UsuarioService {
  static async findOrCreateFromSession(sessionUser) {
    const email = sessionUser.email;

    let usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          email,
          nome: sessionUser.name || email.split("@")[0],
        },
      });
    } else {
      // Atualizar o nome se temos um nome melhor do NextAuth
      if (
        sessionUser.name &&
        sessionUser.name !== usuario.nome &&
        sessionUser.name !== email.split("@")[0]
      ) {
        usuario = await prisma.usuario.update({
          where: { email },
          data: { nome: sessionUser.name },
        });
      }
    }

    return usuario;
  }

  static async findByEmail(email) {
    return await prisma.usuario.findUnique({
      where: { email },
    });
  }
}

// Service para gerenciar inventários
class InventarioService {
  static async findByName(nome) {
    try {
      return await prisma.inventario.findUnique({
        where: { nome },
        include: {
          proprietario: {
            select: { email: true, nome: true },
          },
        },
      });
    } catch (error) {
      console.error(`Erro em findByName:`, error);
      throw error;
    }
  }

  static async create(nome, nomeExibicao = null, userEmail = null) {
    let proprietarioId = null;

    if (userEmail) {
      const proprietario = await UsuarioService.findOrCreateFromSession({
        email: userEmail,
        name: userEmail.split("@")[0],
      });
      proprietarioId = proprietario.id;
    }

    return await prisma.inventario.create({
      data: {
        nome,
        nomeExibicao: nomeExibicao || nome,
        proprietarioId,
      },
    });
  }

  static async isOwner(nomeInventario, userEmail) {
    const inventario = await this.findByName(nomeInventario);
    if (!inventario) return false;

    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) return false;

    return inventario.proprietarioId === usuario.id;
  }

  static async checkPermissions(nomeInventario, userEmail) {
    const inventario = await this.findByName(nomeInventario);
    if (!inventario) {
      return { hasAccess: false, isOwner: false };
    }

    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) {
      return { hasAccess: false, isOwner: false };
    }

    const isOwner = inventario.proprietarioId === usuario.id;
    if (isOwner) {
      return { hasAccess: true, isOwner: true };
    }

    const permissao = await prisma.permissao.findUnique({
      where: {
        inventarioId_usuarioId: {
          inventarioId: inventario.id,
          usuarioId: usuario.id,
        },
      },
    });

    return {
      hasAccess: permissao?.ativa === true,
      isOwner: false,
    };
  }

  static async listUserInventarios(userEmail) {
    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) return [];

    // Buscar inventários onde o usuário é proprietário
    const inventariosProprietario = await prisma.inventario.findMany({
      where: { proprietarioId: usuario.id },
      select: {
        id: true,
        nome: true,
        nomeExibicao: true,
        createdAt: true,
        proprietario: {
          select: {
            nome: true,
            email: true,
          },
        },
        _count: {
          select: { itens: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Buscar inventários onde o usuário tem permissão
    const permissoes = await prisma.permissao.findMany({
      where: {
        usuarioId: usuario.id,
        ativa: true,
      },
      include: {
        inventario: {
          select: {
            id: true,
            nome: true,
            nomeExibicao: true,
            createdAt: true,
            proprietario: {
              select: {
                nome: true,
                email: true,
              },
            },
            _count: {
              select: { itens: true },
            },
          },
        },
      },
    });

    const inventariosComPermissao = permissoes
      .map((p) => p.inventario)
      .filter((inv) => inv !== null);

    // Combinar e remover duplicatas
    const todosInventarios = [
      ...inventariosProprietario,
      ...inventariosComPermissao,
    ];
    const inventariosUnicos = todosInventarios.filter(
      (inventario, index, self) =>
        inventario &&
        index === self.findIndex((i) => i && i.id === inventario.id)
    );

    return inventariosUnicos;
  }

  static async excluirCompleto(inventarioId) {
    // Excluir em cascata todos os dados relacionados ao inventário
    try {
      // 1. Excluir correções relacionadas
      await prisma.correcaoItem.deleteMany({
        where: { inventarioId: inventarioId },
      });

      // 2. Excluir itens do inventário
      await prisma.itemInventario.deleteMany({
        where: { inventarioId: inventarioId },
      });

      // 3. Excluir salas do inventário
      await prisma.sala.deleteMany({
        where: { inventarioId: inventarioId },
      });

      // 4. Excluir cabeçalhos do inventário
      await prisma.cabecalhoInventario.deleteMany({
        where: { inventarioId: inventarioId },
      });

      // 5. Excluir permissões do inventário
      await prisma.permissao.deleteMany({
        where: { inventarioId: inventarioId },
      });

      // 6. Excluir auditorias relacionadas
      await prisma.auditLog.deleteMany({
        where: { inventarioId: inventarioId },
      });

      // 7. Por último, excluir o inventário
      await prisma.inventario.delete({
        where: { id: inventarioId },
      });

      console.log(
        `[EXCLUSAO] Inventário ${inventarioId} e todos os dados relacionados excluídos com sucesso`
      );

      return true;
    } catch (error) {
      console.error(
        `[EXCLUSAO] Erro ao excluir inventário ${inventarioId}:`,
        error
      );
      throw error;
    }
  }

  static async findByOwner(usuarioId) {
    try {
      return await prisma.inventario.findMany({
        where: { proprietarioId: usuarioId },
        include: {
          _count: {
            select: {
              itens: true,
              correcoes: true,
              permissoes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error(
        "[INVENTARIO] Erro ao buscar inventários do proprietário:",
        error
      );
      throw error;
    }
  }

  static async findByUser(usuarioId) {
    try {
      return await prisma.inventario.findMany({
        where: {
          OR: [
            { proprietarioId: usuarioId },
            {
              permissoes: {
                some: {
                  usuarioId: usuarioId,
                  ativa: true,
                },
              },
            },
          ],
        },
        include: {
          proprietario: {
            select: { nome: true, email: true },
          },
          _count: {
            select: {
              itens: true,
              correcoes: true,
              permissoes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error(
        "[INVENTARIO] Erro ao buscar inventários do usuário:",
        error
      );
      throw error;
    }
  }

  static async getEstatisticasGerais(usuarioId) {
    try {
      // Buscar inventários do usuário
      const inventarios = await this.findByUser(usuarioId);
      const inventarioIds = inventarios.map((inv) => inv.id);

      if (inventarioIds.length === 0) {
        return {
          totalItens: 0,
          itensInventariados: 0,
          itensNaoInventariados: 0,
          totalCorrecoes: 0,
          percentualConcluido: 0,
        };
      }

      // Buscar estatísticas dos itens
      const [totalItens, itensInventariados, totalCorrecoes] =
        await Promise.all([
          prisma.itemInventario.count({
            where: { inventarioId: { in: inventarioIds } },
          }),
          prisma.itemInventario.count({
            where: {
              inventarioId: { in: inventarioIds },
              dataInventario: { not: null },
            },
          }),
          prisma.correcaoItem.count({
            where: { inventarioId: { in: inventarioIds } },
          }),
        ]);

      const itensNaoInventariados = totalItens - itensInventariados;
      const percentualConcluido =
        totalItens > 0
          ? Math.round((itensInventariados / totalItens) * 100)
          : 0;

      return {
        totalItens,
        itensInventariados,
        itensNaoInventariados,
        totalCorrecoes,
        percentualConcluido,
      };
    } catch (error) {
      console.error("[INVENTARIO] Erro ao buscar estatísticas gerais:", error);
      throw error;
    }
  }

  static async getEstatisticasInventario(inventarioId) {
    try {
      // Buscar estatísticas específicas do inventário
      const [totalItens, itensInventariados, totalCorrecoes, totalSalas] =
        await Promise.all([
          prisma.itemInventario.count({
            where: { inventarioId },
          }),
          prisma.itemInventario.count({
            where: {
              inventarioId,
              dataInventario: { not: null },
            },
          }),
          prisma.correcaoItem.count({
            where: { inventarioId },
          }),
          prisma.sala.count({
            where: { inventarioId },
          }),
        ]);

      const itensNaoInventariados = totalItens - itensInventariados;
      const percentualConcluido =
        totalItens > 0
          ? Math.round((itensInventariados / totalItens) * 100)
          : 0;

      return {
        totalItens,
        itensInventariados,
        itensNaoInventariados,
        totalCorrecoes,
        totalSalas,
        percentualConcluido,
      };
    } catch (error) {
      console.error(
        "[INVENTARIO] Erro ao buscar estatísticas do inventário:",
        error
      );
      throw error;
    }
  }

  static async getEstatisticasPorSala(inventarioId) {
    try {
      // Buscar todas as salas com estatísticas
      const salas = await prisma.sala.findMany({
        where: { inventarioId },
        select: { nome: true },
        orderBy: { nome: "asc" },
      });

      const estatisticasSalas = await Promise.all(
        salas.map(async (sala) => {
          const [totalItens, itensInventariados] = await Promise.all([
            prisma.itemInventario.count({
              where: {
                inventarioId,
                sala: sala.nome,
              },
            }),
            prisma.itemInventario.count({
              where: {
                inventarioId,
                sala: sala.nome,
                dataInventario: { not: null },
              },
            }),
          ]);

          const percentual =
            totalItens > 0
              ? Math.round((itensInventariados / totalItens) * 100)
              : 0;

          return {
            nome: sala.nome,
            totalItens,
            itensInventariados,
            itensNaoInventariados: totalItens - itensInventariados,
            percentual,
          };
        })
      );

      return estatisticasSalas;
    } catch (error) {
      console.error(
        "[INVENTARIO] Erro ao buscar estatísticas por sala:",
        error
      );
      throw error;
    }
  }

  static async getResumoCorrecoes(inventarioId) {
    try {
      const correcoes = await prisma.correcaoItem.findMany({
        where: { inventarioId },
        include: {
          inventariante: {
            select: { nome: true },
          },
        },
        orderBy: { dataCorrecao: "desc" },
        take: 10,
      });

      const totalCorrecoes = await prisma.correcaoItem.count({
        where: { inventarioId },
      });

      const correcoesPorUsuario = await prisma.correcaoItem.groupBy({
        by: ["inventarianteId"],
        where: { inventarioId },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      });

      return {
        total: totalCorrecoes,
        recentes: correcoes,
        porUsuario: correcoesPorUsuario,
      };
    } catch (error) {
      console.error("[INVENTARIO] Erro ao buscar resumo de correções:", error);
      throw error;
    }
  }
}

// Service para gerenciar itens de inventário
class ItemInventarioService {
  static async findByNumero(nomeInventario, numero) {
    try {
      const inventario = await InventarioService.findByName(nomeInventario);

      if (!inventario) {
        return null;
      }

      return await prisma.itemInventario.findFirst({
        where: {
          inventarioId: inventario.id,
          numero: numero.toString(),
        },
        include: {
          inventariante: {
            select: { nome: true, email: true },
          },
        },
      });
    } catch (error) {
      console.error(`Erro em findByNumero:`, error);
      throw error;
    }
  }

  static async create(nomeInventario, dados) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    // Mapear os campos do Excel para os campos do Prisma
    const itemData = {
      inventarioId: inventario.id,
      numero: dados.NUMERO?.toString() || "",
      status: dados.STATUS || "",
      ed: dados.ED || "",
      contaContabil: dados["CONTA CONTABIL"] || "",
      descricao: dados.DESCRICAO || "",
      rotulos: dados.RÓTULOS || "",
      cargaAtual: dados["CARGA ATUAL"] || "",
      setorResponsavel: dados["SETOR DO RESPONSÁVEL"] || "",
      campusCarga: dados["CAMPUS DA CARGA"] || "",
      cargaContabil: dados["CARGA CONTÁBIL"] || "",
      valorAquisicao: dados["VALOR AQUISIÇÃO"] || "",
      valorDepreciado: dados["VALOR DEPRECIADO"] || "",
      numeroNotaFiscal: dados["NUMERO NOTA FISCAL"] || "",
      numeroSerie: dados["NÚMERO DE SÉRIE"] || "",
      dataEntrada: dados["DATA DA ENTRADA"] || "",
      dataCarga: dados["DATA DA CARGA"] || "",
      fornecedor: dados.FORNECEDOR || "",
      sala: dados.SALA || "",
      estadoConservacao: dados["ESTADO DE CONSERVAÇÃO"] || "",
    };

    return await prisma.itemInventario.create({
      data: itemData,
    });
  }

  static async update(id, dados) {
    // Mapear os campos do Excel para os campos do Prisma
    const itemData = {
      numero: dados.NUMERO?.toString() || "",
      status: dados.STATUS || "",
      ed: dados.ED || "",
      contaContabil: dados["CONTA CONTABIL"] || "",
      descricao: dados.DESCRICAO || "",
      rotulos: dados.RÓTULOS || "",
      cargaAtual: dados["CARGA ATUAL"] || "",
      setorResponsavel: dados["SETOR DO RESPONSÁVEL"] || "",
      campusCarga: dados["CAMPUS DA CARGA"] || "",
      cargaContabil: dados["CARGA CONTÁBIL"] || "",
      valorAquisicao: dados["VALOR AQUISIÇÃO"] || "",
      valorDepreciado: dados["VALOR DEPRECIADO"] || "",
      numeroNotaFiscal: dados["NUMERO NOTA FISCAL"] || "",
      numeroSerie: dados["NÚMERO DE SÉRIE"] || "",
      dataEntrada: dados["DATA DA ENTRADA"] || "",
      dataCarga: dados["DATA DA CARGA"] || "",
      fornecedor: dados.FORNECEDOR || "",
      sala: dados.SALA || "",
      estadoConservacao: dados["ESTADO DE CONSERVAÇÃO"] || "",
    };

    return await prisma.itemInventario.update({
      where: { id },
      data: itemData,
    });
  }

  // Método específico para atualização de inventário por número
  static async updateInventario(
    nomeInventario,
    numero,
    updateData,
    userEmail = null
  ) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    // Buscar o item pelo número no inventário específico
    const item = await prisma.itemInventario.findFirst({
      where: {
        inventarioId: inventario.id,
        numero: numero.toString(),
      },
    });

    if (!item) {
      throw new Error(
        `Item ${numero} não encontrado no inventário ${nomeInventario}`
      );
    }

    // Preparar dados para atualização
    const itemData = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Se tem informações de inventariante, adicionar
    if (userEmail) {
      const usuario = await UsuarioService.findByEmail(userEmail);
      if (usuario) {
        itemData.inventarianteId = usuario.id;
      }
    }

    return await prisma.itemInventario.update({
      where: { id: item.id },
      data: itemData,
    });
  }

  static async delete(id) {
    return await prisma.itemInventario.delete({
      where: { id },
    });
  }

  static async findByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.itemInventario.findMany({
      where: { inventarioId: inventario.id },
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Alias para compatibilidade com API routes
  static async listByInventario(nomeInventario) {
    return await this.findByInventario(nomeInventario);
  }
}

// Service para gerenciar salas
class SalaService {
  static async findByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.sala.findMany({
      where: { inventarioId: inventario.id },
      orderBy: { nome: "asc" },
    });
  }

  static async create(nomeInventario, dados) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    return await prisma.sala.create({
      data: {
        inventarioId: inventario.id,
        ...dados,
      },
    });
  }

  static async createMany(nomeInventario, salas) {
    console.log(
      `[SalaService] Criando ${salas.length} salas para ${nomeInventario}`
    );

    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) {
      console.log(
        `[SalaService] ERRO: Inventário ${nomeInventario} não encontrado`
      );
      throw new Error("Inventário não encontrado");
    }

    // Remover duplicatas e criar dados únicos
    const salasUnicas = [
      ...new Set(salas.filter((sala) => sala && sala.trim() !== "")),
    ];

    const salasData = salasUnicas.map((nome) => ({
      inventarioId: inventario.id,
      nome: nome.trim(),
    }));

    console.log(
      `[SalaService] Dados preparados para ${salasData.length} salas únicas`
    );

    if (salasData.length === 0) {
      console.log(`[SalaService] Nenhuma sala válida para criar`);
      return [];
    }

    return await prisma.sala.createMany({
      data: salasData,
      skipDuplicates: true, // Ignora duplicatas no banco
    });
  }

  // Alias para compatibilidade com API routes
  static async listByInventario(nomeInventario) {
    return await this.findByInventario(nomeInventario);
  }
}

// Service para gerenciar cabeçalhos
class CabecalhoService {
  static async findByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.cabecalhoInventario.findMany({
      where: { inventarioId: inventario.id },
      orderBy: { ordem: "asc" },
    });
  }

  static async create(nomeInventario, dados) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    return await prisma.cabecalhoInventario.create({
      data: {
        inventarioId: inventario.id,
        ...dados,
      },
    });
  }

  static async createMany(nomeInventario, headers) {
    console.log(
      `[CabecalhoService] Criando ${headers.length} cabeçalhos para ${nomeInventario}`
    );

    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) {
      console.log(
        `[CabecalhoService] ERRO: Inventário ${nomeInventario} não encontrado`
      );
      throw new Error("Inventário não encontrado");
    }

    const cabecalhosData = headers.map((header, index) => ({
      inventarioId: inventario.id,
      campo: header,
      ordem: index + 1,
    }));

    console.log(`[CabecalhoService] Dados preparados:`, cabecalhosData);

    return await prisma.cabecalhoInventario.createMany({
      data: cabecalhosData,
    });
  }

  // Alias para compatibilidade com API routes
  static async listByInventario(nomeInventario) {
    return await this.findByInventario(nomeInventario);
  }
}

// Service para gerenciar permissões
class PermissaoService {
  static async listByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.permissao.findMany({
      where: { inventarioId: inventario.id },
      include: {
        usuario: {
          select: { nome: true, email: true },
        },
      },
    });
  }

  static async canAccessInventario(userEmail, nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return false;

    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) return false;

    // Verifica se é o proprietário
    if (inventario.proprietarioId === usuario.id) {
      return true;
    }

    // Verifica se tem permissão específica
    const permissao = await prisma.permissao.findUnique({
      where: {
        inventarioId_usuarioId: {
          inventarioId: inventario.id,
          usuarioId: usuario.id,
        },
      },
    });

    return permissao?.ativa === true;
  }

  static async findByUserAndInventario(usuarioId, inventarioId) {
    return await prisma.permissao.findUnique({
      where: {
        inventarioId_usuarioId: {
          inventarioId,
          usuarioId,
        },
      },
    });
  }

  static async create(data) {
    return await prisma.permissao.create({
      data: {
        inventarioId: data.inventarioId,
        usuarioId: data.usuarioId,
        ativa: true,
      },
    });
  }

  static async delete(permissaoId) {
    return await prisma.permissao.delete({
      where: { id: permissaoId },
    });
  }
}

// Service para gerenciar auditoria
class AuditoriaService {
  static async log(acao, sessionUser, detalhes = {}, inventario = null) {
    try {
      const usuario = await UsuarioService.findOrCreateFromSession(sessionUser);

      // Buscar o inventário se fornecido como string
      let inventarioId = null;
      if (inventario) {
        const inventarioObj = await InventarioService.findByName(inventario);
        inventarioId = inventarioObj?.id || null;
      }

      return await prisma.auditLog.create({
        data: {
          acao,
          usuarioId: usuario.id,
          inventarioId,
          detalhes,
        },
      });
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
    }
  }

  static async getAtividadeRecente(usuarioId, limite = 10) {
    try {
      return await prisma.auditLog.findMany({
        where: { usuarioId },
        orderBy: { timestamp: "desc" },
        take: limite,
        select: {
          acao: true,
          timestamp: true,
          detalhes: true,
        },
      });
    } catch (error) {
      console.error("[AUDITORIA] Erro ao buscar atividade recente:", error);
      throw error;
    }
  }

  static async getAtividadeRecenteInventario(inventarioId, limite = 15) {
    try {
      return await prisma.auditLog.findMany({
        where: { inventarioId },
        include: {
          usuario: {
            select: { nome: true, email: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limite,
      });
    } catch (error) {
      console.error(
        "[AUDITORIA] Erro ao buscar atividade recente do inventário:",
        error
      );
      throw error;
    }
  }
}

// Service para gerenciar correções de itens
class CorrecaoService {
  /**
   * Lista todas as correções de um inventário
   */
  static async listByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.correcaoItem.findMany({
      where: {
        inventarioId: inventario.id,
      },
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
      },
      orderBy: {
        dataCorrecao: "desc",
      },
    });
  }

  /**
   * Busca correções de um item específico
   */
  static async findByNumeroOriginal(nomeInventario, numeroOriginal) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.correcaoItem.findMany({
      where: {
        inventarioId: inventario.id,
        numeroItemOriginal: numeroOriginal.toString(),
      },
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
      },
      orderBy: {
        dataCorrecao: "asc",
      },
    });
  }

  /**
   * Busca uma correção específica por ID
   */
  static async findById(correcaoId) {
    return await prisma.correcaoItem.findUnique({
      where: {
        id: correcaoId,
      },
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
        inventario: {
          select: { nome: true, nomeExibicao: true },
        },
      },
    });
  }

  /**
   * Conta o número de correções por inventário
   */
  static async countByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return 0;

    return await prisma.correcaoItem.count({
      where: {
        inventarioId: inventario.id,
      },
    });
  }

  /**
   * Verifica se um item específico tem correções
   */
  static async hasCorrections(nomeInventario, numeroItem) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return false;

    const count = await prisma.correcaoItem.count({
      where: {
        inventarioId: inventario.id,
        numeroItemOriginal: numeroItem.toString(),
      },
    });

    return count > 0;
  }

  /**
   * Obter estatísticas de correções para um inventário
   */
  static async getInventoryStats(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return { totalCorrecoes: 0, itensComCorrecao: 0 };

    const totalCorrecoes = await prisma.correcaoItem.count({
      where: {
        inventarioId: inventario.id,
      },
    });

    const itensComCorrecao = await prisma.correcaoItem.groupBy({
      by: ["numeroItemOriginal"],
      where: {
        inventarioId: inventario.id,
      },
    });

    return {
      totalCorrecoes,
      itensComCorrecao: itensComCorrecao.length,
    };
  }
}

export {
  UsuarioService,
  InventarioService,
  ItemInventarioService,
  SalaService,
  CabecalhoService,
  PermissaoService,
  AuditoriaService,
  CorrecaoService,
};
