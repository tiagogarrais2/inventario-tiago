#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importa os services
import {
  UsuarioService,
  InventarioService,
  ItemInventarioService,
  SalaService,
  CabecalhoService,
  PermissaoService,
  AuditoriaService,
} from "../src/lib/services.js";

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LOGS_DIR = path.join(__dirname, "..", "logs");

/**
 * Parse dos logs de auditoria para extrair informações dos proprietários
 */
async function parseAuditLogs() {
  const auditData = {};

  try {
    const logFiles = await fs.readdir(LOGS_DIR);

    for (const logFile of logFiles) {
      if (!logFile.endsWith(".log")) continue;

      const logPath = path.join(LOGS_DIR, logFile);
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");

      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);

          // Procura por uploads de inventário
          if (
            logEntry.acao === "UPLOAD_INVENTARIO" &&
            logEntry.detalhes?.processamento?.nomePasta
          ) {
            const inventarioNome = logEntry.detalhes.processamento.nomePasta;

            if (!auditData[inventarioNome]) {
              auditData[inventarioNome] = {
                proprietario: {
                  nome: logEntry.usuario.nome,
                  email: logEntry.usuario.email,
                },
                timestamp: logEntry.timestamp,
                detalhes: logEntry.detalhes,
              };
            }
          }
        } catch (parseError) {
          console.warn(`Erro ao parsear linha do log: ${parseError.message}`);
        }
      }
    }
  } catch (error) {
    console.warn(`Erro ao ler logs de auditoria: ${error.message}`);
  }

  return auditData;
}

/**
 * Migra um inventário específico
 */
async function migrateInventario(inventarioFolder, auditData) {
  console.log(`\n📦 Migrando inventário: ${inventarioFolder}`);

  const inventarioPath = path.join(PUBLIC_DIR, inventarioFolder);

  // Verifica se a pasta existe
  try {
    await fs.access(inventarioPath);
  } catch {
    console.log(`❌ Pasta não encontrada: ${inventarioFolder}`);
    return;
  }

  // Obtém informações do proprietário
  const proprietarioInfo = auditData[inventarioFolder] || {
    proprietario: {
      nome: "Usuário Desconhecido",
      email: "unknown@example.com",
    },
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Cria o usuário proprietário
    console.log(
      `👤 Criando/atualizando usuário: ${proprietarioInfo.proprietario.email}`
    );
    const proprietario = await UsuarioService.findOrCreateFromSession(
      proprietarioInfo.proprietario
    );

    // 2. Cria o inventário
    console.log(`📋 Criando inventário: ${inventarioFolder}`);
    let inventario;
    try {
      inventario = await InventarioService.create(
        inventarioFolder,
        inventarioFolder.replace(/inventario-\d+-/, "").replace(/-/g, " "),
        proprietarioInfo.proprietario.email
      );
    } catch (error) {
      if (error.code === "P2002") {
        console.log(`📋 Inventário já existe, obtendo referência...`);
        inventario = await InventarioService.findByName(inventarioFolder);
      } else {
        throw error;
      }
    }

    // 3. Migra cabeçalhos
    const cabecalhosPath = path.join(inventarioPath, "cabecalhos.json");
    try {
      const cabecalhosData = JSON.parse(
        await fs.readFile(cabecalhosPath, "utf-8")
      );
      console.log(`📝 Migrando ${cabecalhosData.length} cabeçalhos...`);
      await CabecalhoService.createMany(inventarioFolder, cabecalhosData);
    } catch (error) {
      console.warn(`⚠️  Erro ao migrar cabeçalhos: ${error.message}`);
    }

    // 4. Migra salas
    const salasPath = path.join(inventarioPath, "salas.json");
    try {
      const salasData = JSON.parse(await fs.readFile(salasPath, "utf-8"));
      console.log(`🏢 Migrando ${salasData.length} salas...`);
      await SalaService.createMany(inventarioFolder, salasData);
    } catch (error) {
      console.warn(`⚠️  Erro ao migrar salas: ${error.message}`);
    }

    // 5. Migra itens do inventário
    const inventarioJsonPath = path.join(inventarioPath, "inventario.json");
    try {
      const itensData = JSON.parse(
        await fs.readFile(inventarioJsonPath, "utf-8")
      );
      console.log(`📦 Migrando ${itensData.length} itens...`);

      let migrados = 0;
      let erros = 0;

      for (const item of itensData) {
        try {
          await ItemInventarioService.create(inventarioFolder, item);
          migrados++;

          if (migrados % 100 === 0) {
            console.log(
              `   📦 ${migrados}/${itensData.length} itens migrados...`
            );
          }
        } catch (error) {
          erros++;
          if (error.code !== "P2002") {
            // Ignora duplicatas
            console.warn(
              `⚠️  Erro ao migrar item ${item.NUMERO}: ${error.message}`
            );
          }
        }
      }

      console.log(`✅ Itens migrados: ${migrados}, Erros: ${erros}`);
    } catch (error) {
      console.warn(`⚠️  Erro ao migrar itens: ${error.message}`);
    }

    // 6. Migra permissões
    const permissoesPath = path.join(inventarioPath, "permissoes.json");
    try {
      const permissoesData = JSON.parse(
        await fs.readFile(permissoesPath, "utf-8")
      );
      console.log(`🔐 Migrando ${permissoesData.length} permissões...`);

      for (const permissao of permissoesData) {
        if (permissao.ativa) {
          try {
            await PermissaoService.grant(inventarioFolder, permissao.email);
          } catch (error) {
            console.warn(
              `⚠️  Erro ao migrar permissão para ${permissao.email}: ${error.message}`
            );
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Erro ao migrar permissões: ${error.message}`);
    }

    console.log(`✅ Inventário ${inventarioFolder} migrado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao migrar inventário ${inventarioFolder}:`, error);
  }
}

/**
 * Função principal de migração
 */
async function main() {
  console.log("🚀 Iniciando migração de dados do JSON para PostgreSQL...\n");

  try {
    // 1. Parse dos logs de auditoria
    console.log("📋 Analisando logs de auditoria...");
    const auditData = await parseAuditLogs();
    console.log(
      `📋 Encontrados ${Object.keys(auditData).length} inventários nos logs`
    );

    // 2. Lista todas as pastas de inventário
    const inventarioFolders = await fs.readdir(PUBLIC_DIR);
    const inventariosPastas = inventarioFolders.filter(
      (folder) => folder.startsWith("inventario-") && !folder.includes(".")
    );

    console.log(
      `📁 Encontradas ${inventariosPastas.length} pastas de inventário`
    );

    // 3. Migra cada inventário
    for (const inventarioFolder of inventariosPastas) {
      await migrateInventario(inventarioFolder, auditData);
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(
      `📊 Total de inventários processados: ${inventariosPastas.length}`
    );
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as migrate };
