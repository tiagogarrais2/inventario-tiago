import fs from "fs";
import path from "path";

// Função para registrar logs de auditoria em arquivo
export async function logAuditoria(acao, usuario, detalhes = {}) {
  const logDir = path.join(process.cwd(), "logs");
  const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const logFile = path.join(logDir, `auditoria-${hoje}.log`);

  // Criar diretório de logs se não existir
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    acao,
    usuario: {
      nome: usuario?.name,
      email: usuario?.email,
      id: usuario?.id,
    },
    detalhes,
    ip: detalhes.ip || "N/A",
  };

  const logLine = JSON.stringify(logEntry) + "\n";

  try {
    fs.appendFileSync(logFile, logLine, "utf8");
  } catch (error) {
    console.error("Erro ao escrever log de auditoria:", error);
  }
}

// Função para obter IP do usuário (quando disponível)
export function obterIP(request) {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "IP não disponível"
  );
}
