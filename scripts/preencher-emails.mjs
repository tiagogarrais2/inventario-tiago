#!/usr/bin/env node
/**
 * Script descartável para preencher emails dos servidores
 * por similaridade com nomes dos usuários do Google Auth.
 *
 * Uso:
 *   node scripts/preencher-emails.mjs                    # dry-run (só mostra)
 *   node scripts/preencher-emails.mjs --apply             # aplica no banco
 *   node scripts/preencher-emails.mjs --min-score 70      # muda score mínimo (padrão: 80)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const MIN_SCORE_IDX = args.indexOf("--min-score");
const MIN_SCORE = MIN_SCORE_IDX !== -1 ? Number(args[MIN_SCORE_IDX + 1]) : 80;

// ─── Funções de normalização ────────────────────────────────────────

function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizar(str) {
  return removerAcentos(str).toLowerCase().trim().replace(/\s+/g, " ");
}

function extrairNome(cargaAtual) {
  // Remove "(Setor - Local)" do final
  return cargaAtual.replace(/\s*\(.*\)\s*$/, "").trim();
}

function tokensDoEmail(email) {
  // "jose.oliveira.souza@ifce.edu.br" → ["jose", "oliveira", "souza"]
  const prefixo = email.split("@")[0];
  return prefixo.split(/[._-]/).filter(Boolean);
}

// ─── Funções de similaridade ────────────────────────────────────────

function calcularSimilaridade(nomeServidor, usuario) {
  const nLimpo = normalizar(extrairNome(nomeServidor));
  const nUsuario = normalizar(usuario.nome);
  const tokensEmail = tokensDoEmail(usuario.email).map(normalizar);

  const tokensServidor = nLimpo.split(" ");
  const tokensUsuario = nUsuario.split(" ");

  // 1. Match exato normalizado
  if (nLimpo === nUsuario) {
    return { score: 100, metodo: "exato" };
  }

  // 2. Containment — um está contido no outro
  if (nLimpo.includes(nUsuario) && nUsuario.length >= 5) {
    const ratio = nUsuario.length / nLimpo.length;
    return { score: Math.round(80 + ratio * 15), metodo: "containment" };
  }
  if (nUsuario.includes(nLimpo) && nLimpo.length >= 5) {
    const ratio = nLimpo.length / nUsuario.length;
    return { score: Math.round(80 + ratio * 15), metodo: "containment" };
  }

  // 3. Match por tokens do email (jose.oliveira@ vs "Jose Oliveira")
  if (tokensEmail.length >= 2) {
    const matchCount = tokensEmail.filter((t) =>
      tokensServidor.some((ts) => ts === t || ts.startsWith(t) || t.startsWith(ts))
    ).length;
    const emailScore = (matchCount / tokensEmail.length) * 100;
    if (emailScore >= 70) {
      return { score: Math.round(70 + (emailScore - 70) * 0.5), metodo: "email-prefix" };
    }
  }

  // 4. Jaccard de tokens (palavras em comum)
  const setServ = new Set(tokensServidor);
  const setUsr = new Set(tokensUsuario);
  const intersecao = [...setServ].filter((t) => setUsr.has(t)).length;
  const uniao = new Set([...setServ, ...setUsr]).size;
  const jaccard = uniao > 0 ? intersecao / uniao : 0;

  if (jaccard > 0.3) {
    return { score: Math.round(jaccard * 85), metodo: "jaccard" };
  }

  // 5. Match parcial de tokens (prefixo/sufixo)
  const matchParcial = tokensServidor.filter((ts) =>
    tokensUsuario.some(
      (tu) =>
        (ts.length >= 3 && tu.startsWith(ts)) ||
        (tu.length >= 3 && ts.startsWith(tu))
    )
  ).length;
  if (matchParcial >= 2) {
    const parcialScore = (matchParcial / Math.max(tokensServidor.length, tokensUsuario.length)) * 75;
    return { score: Math.round(parcialScore), metodo: "parcial" };
  }

  return { score: 0, metodo: "nenhum" };
}

function encontrarMelhorMatch(nomeServidor, usuarios) {
  let melhor = { usuario: null, score: 0, metodo: "nenhum" };

  for (const usuario of usuarios) {
    const { score, metodo } = calcularSimilaridade(nomeServidor, usuario);
    if (score > melhor.score) {
      melhor = { usuario, score, metodo };
    }
  }

  return melhor;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Preencher Emails de Servidores por Similaridade");
  console.log(`  Modo: ${APPLY ? "🔴 APLICAR" : "🔵 DRY-RUN (apenas mostrar)"}`);
  console.log(`  Score mínimo: ${MIN_SCORE}`);
  console.log("═══════════════════════════════════════════════════════\n");

  // Buscar dados
  const servidores = await prisma.servidor.findMany({
    orderBy: { nome: "asc" },
  });
  const usuarios = await prisma.usuario.findMany({
    select: { nome: true, email: true },
  });

  console.log(`Servidores encontrados: ${servidores.length}`);
  console.log(`Usuários encontrados: ${usuarios.length}\n`);

  const resultados = {
    preenchidos: [],
    jaTemEmail: [],
    semMatch: [],
    scoreBaixo: [],
  };

  for (const srv of servidores) {
    if (srv.email) {
      resultados.jaTemEmail.push(srv);
      continue;
    }

    const match = encontrarMelhorMatch(srv.nome, usuarios);

    if (match.score >= MIN_SCORE) {
      resultados.preenchidos.push({
        servidor: srv.nome,
        email: match.usuario.email,
        nomeUsuario: match.usuario.nome,
        score: match.score,
        metodo: match.metodo,
      });
    } else if (match.score > 0) {
      resultados.scoreBaixo.push({
        servidor: srv.nome,
        melhorMatch: match.usuario?.nome || "—",
        melhorEmail: match.usuario?.email || "—",
        score: match.score,
        metodo: match.metodo,
      });
    } else {
      resultados.semMatch.push(srv.nome);
    }
  }

  // ─── Relatório ──────────────────────────────────────────────────

  // Matches aprovados
  if (resultados.preenchidos.length > 0) {
    console.log(`\n✅ MATCHES APROVADOS (score ≥ ${MIN_SCORE}): ${resultados.preenchidos.length}`);
    console.log("─".repeat(100));
    console.log(
      "Servidor".padEnd(45) +
      "Email".padEnd(35) +
      "Score".padEnd(8) +
      "Método"
    );
    console.log("─".repeat(100));
    for (const m of resultados.preenchidos) {
      console.log(
        m.servidor.substring(0, 44).padEnd(45) +
        m.email.padEnd(35) +
        String(m.score).padEnd(8) +
        m.metodo
      );
    }
  }

  // Score baixo
  if (resultados.scoreBaixo.length > 0) {
    console.log(`\n⚠️  SCORE BAIXO (< ${MIN_SCORE}): ${resultados.scoreBaixo.length} — preencher manualmente na UI`);
    console.log("─".repeat(100));
    console.log(
      "Servidor".padEnd(45) +
      "Melhor Match".padEnd(30) +
      "Email".padEnd(35) +
      "Score".padEnd(8) +
      "Método"
    );
    console.log("─".repeat(100));
    for (const m of resultados.scoreBaixo) {
      console.log(
        m.servidor.substring(0, 44).padEnd(45) +
        m.melhorMatch.substring(0, 29).padEnd(30) +
        m.melhorEmail.padEnd(35) +
        String(m.score).padEnd(8) +
        m.metodo
      );
    }
  }

  // Sem match
  if (resultados.semMatch.length > 0) {
    console.log(`\n❌ SEM MATCH: ${resultados.semMatch.length}`);
    console.log("─".repeat(60));
    for (const nome of resultados.semMatch) {
      console.log(`  ${nome}`);
    }
  }

  // Já tem email
  if (resultados.jaTemEmail.length > 0) {
    console.log(`\nℹ️  JÁ TÊM EMAIL: ${resultados.jaTemEmail.length}`);
  }

  // ─── Resumo Final ───────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  RESUMO");
  console.log(`  ✅ Aprovados para preencher: ${resultados.preenchidos.length}`);
  console.log(`  ⚠️  Score baixo (preencher manual): ${resultados.scoreBaixo.length}`);
  console.log(`  ❌ Sem nenhum match: ${resultados.semMatch.length}`);
  console.log(`  ℹ️  Já tinham email: ${resultados.jaTemEmail.length}`);
  console.log("═══════════════════════════════════════════════════════");

  // Aplicar apenas os aprovados (score >= MIN_SCORE)
  if (APPLY && resultados.preenchidos.length > 0) {
    console.log(`\n🔴 Aplicando ${resultados.preenchidos.length} emails no banco de dados...`);

    const operations = resultados.preenchidos.map((m) =>
      prisma.servidor.updateMany({
        where: { nome: m.servidor, email: null },
        data: { email: m.email },
      })
    );

    await prisma.$transaction(operations);
    console.log(`✅ ${resultados.preenchidos.length} emails atualizados com sucesso!`);
  } else if (!APPLY && resultados.preenchidos.length > 0) {
    console.log("\n💡 Para aplicar, rode: node scripts/preencher-emails.mjs --apply");
  }
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
