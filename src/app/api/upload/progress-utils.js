// Utilitários para progresso do upload via SSE

// Mapa para armazenar conexões SSE ativas
// Chave: sessionId, Valor: { controller, clients: Set }
const activeConnections = new Map();

// Função para enviar progresso para um sessionId específico
export function sendProgress(sessionId, progress) {
  const connection = activeConnections.get(sessionId);
  if (!connection) return false;

  const data = JSON.stringify({
    ...progress,
    timestamp: new Date().toISOString(),
  });

  // Enviar para todos os clientes desta sessão
  for (const controller of connection.clients) {
    try {
      controller.enqueue(`data: ${data}\n\n`);
    } catch (error) {
      // Cliente desconectado, remover
      connection.clients.delete(controller);
    }
  }

  connection.lastActivity = Date.now();
  return connection.clients.size > 0;
}

// Função para registrar uma nova conexão SSE
export function registerConnection(sessionId, controller) {
  if (!activeConnections.has(sessionId)) {
    activeConnections.set(sessionId, {
      controller,
      clients: new Set(),
      lastActivity: Date.now(),
    });
  }

  const connection = activeConnections.get(sessionId);
  connection.clients.add(controller);
  connection.lastActivity = Date.now();

  return connection;
}

// Função para remover uma conexão
export function removeConnection(sessionId, controller) {
  const connection = activeConnections.get(sessionId);
  if (connection) {
    connection.clients.delete(controller);
    if (connection.clients.size === 0) {
      // Se não há mais clientes, limpar após um tempo
      setTimeout(() => {
        if (activeConnections.get(sessionId)?.clients.size === 0) {
          activeConnections.delete(sessionId);
        }
      }, 30000); // 30 segundos
    }
  }
}

// Função para limpar conexões antigas
export function cleanupOldConnections() {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutos

  for (const [sessionId, connection] of activeConnections.entries()) {
    if (now - connection.lastActivity > timeout) {
      // Fechar todas as conexões desta sessão
      for (const controller of connection.clients) {
        try {
          controller.close();
        } catch (error) {
          // Ignorar erros ao fechar
        }
      }
      activeConnections.delete(sessionId);
    }
  }
}

// Limpar conexões antigas a cada 5 minutos
if (typeof globalThis !== "undefined") {
  setInterval(cleanupOldConnections, 5 * 60 * 1000);
}
