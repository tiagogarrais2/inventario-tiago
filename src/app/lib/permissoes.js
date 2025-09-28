import { InventarioService } from "../../lib/services.js";

// Verificar se usuário é proprietário do inventário
export async function isOwner(inventarioNome, userEmail) {
  try {
    return await InventarioService.isOwner(inventarioNome, userEmail);
  } catch (error) {
    console.error("Erro ao verificar proprietário:", error);
    return false;
  }
}

// Verificar se usuário tem permissão para acessar inventário
export async function hasPermission(inventarioNome, userEmail) {
  try {
    console.log(
      `[DEBUG PERMISSION] Verificando: ${inventarioNome} para ${userEmail}`
    );
    const result = await InventarioService.checkPermissions(
      inventarioNome,
      userEmail
    );
    console.log(`[DEBUG PERMISSION] Resultado:`, result);
    return result;
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    return { hasAccess: false, isOwner: false };
  }
}

// Obter informações do proprietário do inventário
export async function getOwnerInfo(inventarioNome) {
  try {
    const inventario = await InventarioService.findByName(inventarioNome);
    if (!inventario) return null;

    return {
      nome: inventario.proprietario.nome,
      email: inventario.proprietario.email,
      dataUpload: inventario.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Erro ao obter informações do proprietário:", error);
    return null;
  }
}

// Listar usuários com permissão
export async function getUsersWithPermission(inventarioNome) {
  try {
    const { PermissaoService } = await import("../../lib/services");
    const permissoes = await PermissaoService.listByInventario(inventarioNome);

    return permissoes
      .filter((p) => p.ativa)
      .map((p) => ({
        nome: p.usuario.nome,
        email: p.usuario.email,
        ativa: p.ativa,
      }));
  } catch (error) {
    console.error("Erro ao listar usuários com permissão:", error);
    return [];
  }
}
