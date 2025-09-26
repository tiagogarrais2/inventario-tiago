import { promises as fs } from "fs";
import path from "path";

// Verificar se usuário é proprietário do inventário
export async function isOwner(inventarioNome, userEmail) {
  try {
    const auditPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "auditoria.json"
    );
    const auditData = JSON.parse(await fs.readFile(auditPath, "utf8"));
    return auditData.usuario.email === userEmail;
  } catch (error) {
    return false;
  }
}

// Verificar se usuário tem permissão para acessar inventário
export async function hasPermission(inventarioNome, userEmail) {
  try {
    // Primeiro verifica se é o proprietário
    if (await isOwner(inventarioNome, userEmail)) {
      return { hasAccess: true, isOwner: true };
    }

    // Se não é proprietário, verifica permissões
    const permissoesPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "permissoes.json"
    );
    const data = await fs.readFile(permissoesPath, "utf8");
    const permissoes = JSON.parse(data);

    const temPermissao = permissoes.some(
      (p) => p.email === userEmail && p.ativa
    );
    return { hasAccess: temPermissao, isOwner: false };
  } catch (error) {
    return { hasAccess: false, isOwner: false };
  }
}

// Obter informações do proprietário do inventário
export async function getOwnerInfo(inventarioNome) {
  try {
    const auditPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "auditoria.json"
    );
    const auditData = JSON.parse(await fs.readFile(auditPath, "utf8"));
    return {
      nome: auditData.usuario.nome,
      email: auditData.usuario.email,
      dataCriacao: auditData.processamento.timestamp,
    };
  } catch (error) {
    return null;
  }
}

// Listar usuários com permissão
export async function getUsersWithPermission(inventarioNome) {
  try {
    const permissoesPath = path.join(
      process.cwd(),
      "public",
      inventarioNome,
      "permissoes.json"
    );
    const data = await fs.readFile(permissoesPath, "utf8");
    const permissoes = JSON.parse(data);

    return permissoes.filter((p) => p.ativa);
  } catch (error) {
    return [];
  }
}
