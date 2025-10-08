#!/usr/bin/env node

import { ServidorService, InventarioService } from "../src/lib/services.js";

async function testServidores() {
  try {
    console.log("🔍 Testando extração e salvamento de servidores...\n");

    // Listar todos os inventários
    console.log("📋 Inventários disponíveis:");
    const inventarios = await InventarioService.listUserInventarios(
      "tiago.arrais@ifce.edu.br"
    );
    inventarios.forEach((inv) => {
      console.log(`- ${inv.nome} (${inv.nomeExibicao})`);
    });

    if (inventarios.length === 0) {
      console.log("❌ Nenhum inventário encontrado");
      return;
    }

    // Testar com o inventário mais recente
    const inventarioTeste = inventarios[0].nome;
    console.log(`\n🖥️ Testando servidores para: ${inventarioTeste}`);

    try {
      const servidores =
        await ServidorService.listByInventario(inventarioTeste);
      console.log(`✅ Servidores encontrados: ${servidores.length}`);
      if (servidores.length > 0) {
        console.log("Lista de servidores:");
        servidores.forEach((servidor) => {
          console.log(`  - ${servidor.nome}`);
        });
      } else {
        console.log("❌ Nenhum servidor encontrado para este inventário");
        console.log(
          "💡 Isso pode indicar que o upload não salvou os servidores corretamente"
        );
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar servidores: ${error.message}`);
    }
  } catch (error) {
    console.error("Erro geral:", error);
  }

  process.exit(0);
}

testServidores();
