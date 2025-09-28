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
        name: userEmail.split('@')[0]
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
        createdAt: true,
        _count: {
          select: { itens: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar inventários onde o usuário tem permissão
    const permissoes = await prisma.permissao.findMany({
      where: { 
        usuarioId: usuario.id,
        ativa: true 
      },
      include: {
        inventario: {
          select: {
            id: true,
            nome: true,
            createdAt: true,
            _count: {
              select: { itens: true }
            }
          }
        }
      }
    });

    const inventariosComPermissao = permissoes.map(p => p.inventario);

    // Combinar e remover duplicatas
    const todosInventarios = [...inventariosProprietario, ...inventariosComPermissao];
    const inventariosUnicos = todosInventarios.filter((inventario, index, self) => 
      index === self.findIndex(i => i.id === inventario.id)
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
        dados: {
          path: ["NUMERO"],
          equals: numero.toString(),
        },
      },
    });
  }

  static async create(nomeInventario, dados) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    return await prisma.itemInventario.create({
      data: {
        inventarioId: inventario.id,
        dados,
      },
    });
  }

  static async update(id, dados) {
    return await prisma.itemInventario.update({
      where: { id },
      data: { dados },
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
      orderBy: { criadoEm: "desc" },
    });
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
    console.log(`[CabecalhoService] Criando ${headers.length} cabeçalhos para ${nomeInventario}`);
    
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) {
      console.log(`[CabecalhoService] ERRO: Inventário ${nomeInventario} não encontrado`);
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
        concedidoPorId: data.concedidoPorId,
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
  AuditoriaService
};