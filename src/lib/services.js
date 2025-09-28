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
      if (sessionUser.name && sessionUser.name !== usuario.nome && sessionUser.name !== email.split("@")[0]) {
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
    return await prisma.inventario.findUnique({
      where: { nome },
      include: {
        proprietario: {
          select: { email: true, nome: true },
        },
      },
    });
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
}

// Service para gerenciar itens de inventário
class ItemInventarioService {
  static async findByNumero(nomeInventario, numero) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return null;

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
}

export {
  UsuarioService,
  InventarioService,
  ItemInventarioService,
  SalaService,
  CabecalhoService,
  PermissaoService,
  AuditoriaService,
};
