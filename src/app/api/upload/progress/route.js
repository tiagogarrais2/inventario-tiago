import { NextResponse } from "next/server";
import { registerConnection, removeConnection } from "../progress-utils.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId é obrigatório" },
      { status: 400 }
    );
  }

  // Criar um ReadableStream para SSE
  const stream = new ReadableStream({
    start(controller) {
      // Registrar a conexão
      registerConnection(sessionId, controller);

      // Enviar evento de conexão estabelecida
      const data = JSON.stringify({
        type: "connected",
        message: "Conexão estabelecida para monitoramento de progresso",
        timestamp: new Date().toISOString(),
      });

      controller.enqueue(`data: ${data}\n\n`);

      // Cleanup quando a conexão for fechada
      request.signal.addEventListener("abort", () => {
        removeConnection(sessionId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
