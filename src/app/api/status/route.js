import { NextResponse } from "next/server";
import prisma from "../../../lib/db.js";

export async function GET() {
  const timestamp = new Date().toISOString();

  // Verificação do banco de dados
  let dbStatus = { status: "error", latencyMs: null, errorType: null, message: null, hint: null };
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      status: "ok",
      latencyMs: Date.now() - start,
      errorType: null,
      message: null,
      hint: null,
    };
  } catch (error) {
    const msg = error.message || "";
    let errorType = "unknown";
    let hint = null;
    // Primeira linha da mensagem do Prisma é a mais relevante
    const shortMsg = msg.split("\n")[0].replace(/^.*invocation:\s*/i, "").trim();

    if (/tls|ssl|handshake/i.test(msg)) {
      errorType = "ssl_error";
      hint = "O servidor não usa SSL/TLS. Verifique sslmode na DATABASE_URL (tente sslmode=disable).";
    } else if (/connection refused|econnrefused|unreachable/i.test(msg)) {
      errorType = "connection_refused";
      hint = "O servidor de banco de dados está inacessível. Verifique o host e a porta.";
    } else if (/authentication|password|role .* does not exist/i.test(msg)) {
      errorType = "auth_error";
      hint = "Credenciais inválidas. Verifique usuário e senha na DATABASE_URL.";
    } else if (/timeout|timed out/i.test(msg)) {
      errorType = "timeout";
      hint = "Tempo limite esgotado. O servidor pode estar sobrecarregado ou inacessível.";
    } else if (/database .* does not exist/i.test(msg)) {
      errorType = "database_not_found";
      hint = "O banco de dados especificado não existe. Verifique o nome na DATABASE_URL.";
    }

    dbStatus = { status: "error", latencyMs: null, errorType, message: shortMsg, hint };
  }

  // Verificação de variáveis de ambiente críticas (apenas presença, nunca o valor)
  const config = {
    databaseUrl: !!process.env.DATABASE_URL,
    nextauthSecret: !!process.env.NEXTAUTH_SECRET,
    nextauthUrl: !!process.env.NEXTAUTH_URL,
    googleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  const overallStatus = dbStatus.status === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp,
      version: "3.3.8",
      environment: process.env.NODE_ENV || "unknown",
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      config,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
