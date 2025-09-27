import prisma from "./db.js";

/**
 * Service para gerenciar usuários
 */
export class UsuarioService {
  /**
   * Busca ou cria um usuário baseado nos dados da sessão
   */
  static async findOrCreateFromSession(sessionUser) {
    const { email, name } = sessionUser;

    let usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          email,
          nome: name || email.split("@")[0], // fallback se name for undefined
        },
      });
    } else if (usuario.nome !== name && name) {
      // Atualiza o nome se mudou e name não for undefined
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { nome: name },
      });
    }

    return usuario;
  }

  /**
   * Busca usuário por email
   */
  static async findByEmail(email) {
    return await prisma.usuario.findUnique({
      where: { email },
    });
  }
}

/**
 * Service para gerenciar inventários
 */
export class InventarioService {
  /**
   * Lista todos os inventários que o usuário tem acesso
   */
  static async listUserInventarios(userEmail) {
    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) return [];

    const inventarios = await prisma.inventario.findMany({
      where: {
        OR: [
          { proprietarioId: usuario.id },
          {
            permissoes: {
              some: {
                usuarioId: usuario.id,
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
          select: { itens: true },
        },
      },
    });

    return inventarios;
  }

  /**
   * Cria um novo inventário
   */
  static async create(nomeInventario, nomeExibicao, proprietarioEmail) {
    const proprietario = await UsuarioService.findOrCreateFromSession({
      email: proprietarioEmail,
      name: proprietarioEmail.split("@")[0], // fallback
    });

    return await prisma.inventario.create({
      data: {
        nome: nomeInventario,
        nomeExibicao,
        proprietarioId: proprietario.id,
      },
      include: {
        proprietario: true,
      },
    });
  }

  /**
   * Busca inventário por nome
   */
  static async findByName(nomeInventario) {
    return await prisma.inventario.findUnique({
      where: { nome: nomeInventario },
      include: {
        proprietario: true,
      },
    });
  }

  /**
   * Verifica se usuário é proprietário do inventário
   */
  static async isOwner(nomeInventario, userEmail) {
    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) return false;

    const inventario = await prisma.inventario.findUnique({
      where: { nome: nomeInventario },
    });

    return inventario?.proprietarioId === usuario.id;
  }

  /**
   * Verifica permissões de acesso do usuário
   */
  static async checkPermissions(nomeInventario, userEmail) {
    console.log(
      `[DEBUG SERVICE] checkPermissions para ${nomeInventario} e ${userEmail}`
    );

    const usuario = await UsuarioService.findByEmail(userEmail);
    console.log(
      `[DEBUG SERVICE] Usuário encontrado:`,
      usuario ? `${usuario.id} - ${usuario.email}` : "null"
    );

    if (!usuario) {
      return { hasAccess: false, isOwner: false };
    }

    const inventario = await prisma.inventario.findUnique({
      where: { nome: nomeInventario },
      include: {
        permissoes: {
          where: {
            usuarioId: usuario.id,
            ativa: true,
          },
        },
      },
    });

    console.log(
      `[DEBUG SERVICE] Inventário encontrado:`,
      inventario ? `${inventario.id} - ${inventario.nome}` : "null"
    );

    if (!inventario) {
      return { hasAccess: false, isOwner: false };
    }

    const isOwner = inventario.proprietarioId === usuario.id;
    const hasPermission = inventario.permissoes.length > 0;
    const hasAccess = isOwner || hasPermission;

    console.log(
      `[DEBUG SERVICE] isOwner: ${isOwner}, hasPermission: ${hasPermission}, hasAccess: ${hasAccess}`
    );
    console.log(
      `[DEBUG SERVICE] inventario.proprietarioId: ${inventario.proprietarioId}, usuario.id: ${usuario.id}`
    );

    return { hasAccess, isOwner };
  }
}

/**
 * Service para gerenciar itens do inventário
 */
export class ItemInventarioService {
  /**
   * Lista todos os itens de um inventário
   */
  static async listByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    return await prisma.itemInventario.findMany({
      where: { inventarioId: inventario.id },
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
      },
      orderBy: { numero: "asc" },
    });
  }

  /**
   * Busca item por número do tombo
   */
  static async findByNumero(nomeInventario, numero) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return null;

    return await prisma.itemInventario.findUnique({
      where: {
        inventarioId_numero: {
          inventarioId: inventario.id,
          numero: numero.toString(),
        },
      },
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
      },
    });
  }

  /**
   * Cria um novo item
   */
  static async create(nomeInventario, itemData) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    return await prisma.itemInventario.create({
      data: {
        inventarioId: inventario.id,
        numero: itemData.NUMERO,
        status: itemData.STATUS,
        ed: itemData.ED,
        contaContabil: itemData["CONTA CONTABIL"],
        descricao: itemData.DESCRICAO,
        rotulos: itemData.RÓTULOS,
        cargaAtual: itemData["CARGA ATUAL"],
        setorResponsavel: itemData["SETOR DO RESPONSÁVEL"],
        campusCarga: itemData["CAMPUS DA CARGA"],
        cargaContabil: itemData["CARGA CONTÁBIL"],
        valorAquisicao: itemData["VALOR AQUISIÇÃO"],
        valorDepreciado: itemData["VALOR DEPRECIADO"],
        numeroNotaFiscal: itemData["NUMERO NOTA FISCAL"],
        numeroSerie: itemData["NÚMERO DE SÉRIE"],
        dataEntrada: itemData["DATA DA ENTRADA"],
        dataCarga: itemData["DATA DA CARGA"],
        fornecedor: itemData.FORNECEDOR,
        marca: itemData.MARCA,
        modelo: itemData.MODELO,
        sala: itemData.SALA,
        setor: itemData.SETOR,
        estadoConservacao: itemData["ESTADO DE CONSERVAÇÃO"],
      },
    });
  }

  /**
   * Atualiza item do inventário
   */
  static async update(nomeInventario, numero, updateData, inventarianteEmail) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    const inventariante = await UsuarioService.findByEmail(inventarianteEmail);

    return await prisma.itemInventario.update({
      where: {
        inventarioId_numero: {
          inventarioId: inventario.id,
          numero: numero.toString(),
        },
      },
      data: {
        dataInventario: new Date(updateData.dataInventario),
        inventarianteId: inventariante?.id,
        salaEncontrada: updateData.salaEncontrada,
        statusInventario: updateData.status,
      },
    });
  }
}

/**
 * Service para gerenciar salas
 */
export class SalaService {
  /**
   * Lista salas de um inventário
   */
  static async listByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    const salas = await prisma.sala.findMany({
      where: { inventarioId: inventario.id },
      select: { nome: true },
      orderBy: { nome: "asc" },
    });

    return salas.map((sala) => sala.nome);
  }

  /**
   * Cria salas para um inventário
   */
  static async createMany(nomeInventario, salasArray) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    const salasData = salasArray.map((nomeSala) => ({
      inventarioId: inventario.id,
      nome: nomeSala,
    }));

    return await prisma.sala.createMany({
      data: salasData,
      skipDuplicates: true,
    });
  }
}

/**
 * Service para gerenciar cabeçalhos
 */
export class CabecalhoService {
  /**
   * Lista cabeçalhos de um inventário
   */
  static async listByInventario(nomeInventario) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) return [];

    const cabecalhos = await prisma.cabecalhoInventario.findMany({
      where: { inventarioId: inventario.id },
      select: { campo: true },
      orderBy: { ordem: "asc" },
    });

    return cabecalhos.map((cab) => cab.campo);
  }

  /**
   * Cria cabeçalhos para um inventário
   */
  static async createMany(nomeInventario, cabecalhosArray) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    const cabecalhosData = cabecalhosArray.map((campo, index) => ({
      inventarioId: inventario.id,
      campo,
      ordem: index,
    }));

    return await prisma.cabecalhoInventario.createMany({
      data: cabecalhosData,
      skipDuplicates: true,
    });
  }
}

/**
 * Service para gerenciar permissões
 */
export class PermissaoService {
  /**
   * Lista permissões de um inventário
   */
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

  /**
   * Adiciona permissão para usuário
   */
  static async grant(nomeInventario, userEmail) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    const usuario = await UsuarioService.findOrCreateFromSession({
      email: userEmail,
      name: userEmail.split("@")[0], // fallback
    });

    return await prisma.permissao.upsert({
      where: {
        inventarioId_usuarioId: {
          inventarioId: inventario.id,
          usuarioId: usuario.id,
        },
      },
      update: {
        ativa: true,
      },
      create: {
        inventarioId: inventario.id,
        usuarioId: usuario.id,
        ativa: true,
      },
    });
  }

  /**
   * Remove permissão de usuário
   */
  static async revoke(nomeInventario, userEmail) {
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) throw new Error("Inventário não encontrado");

    const usuario = await UsuarioService.findByEmail(userEmail);
    if (!usuario) return null;

    return await prisma.permissao.update({
      where: {
        inventarioId_usuarioId: {
          inventarioId: inventario.id,
          usuarioId: usuario.id,
        },
      },
      data: {
        ativa: false,
      },
    });
  }

  /**
   * Verifica se usuário tem acesso ao inventário
   */
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
}

/**
 * Service para auditoria
 */
export class AuditoriaService {
  /**
   * Registra log de auditoria
   */
  static async log(acao, usuario, detalhes = {}, inventarioNome = null) {
    let usuarioId = null;
    let inventarioId = null;

    if (usuario?.email) {
      const userRecord = await UsuarioService.findByEmail(usuario.email);
      usuarioId = userRecord?.id;
    }

    if (inventarioNome) {
      const inventario = await InventarioService.findByName(inventarioNome);
      inventarioId = inventario?.id;
    }

    return await prisma.auditLog.create({
      data: {
        acao,
        usuarioId,
        inventarioId,
        detalhes,
        ip: detalhes.ip,
        userAgent: detalhes.userAgent,
      },
    });
  }
}
