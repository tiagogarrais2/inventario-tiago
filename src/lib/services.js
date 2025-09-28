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

  static async create(data) {
    return await prisma.inventario.create({
      data,
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

    return await prisma.cabecalho.findMany({
      where: { inventarioId: inventario.id },
      orderBy: { ordem: "asc" },
    });
  }

  static async create(nomeInventario, dados) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    return await prisma.cabecalho.create({
      data: {
        inventarioId: inventario.id,
        ...dados,
      },
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

      return await prisma.auditoria.create({
        data: {
          acao,
          usuarioId: usuario.id,
          inventario,
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