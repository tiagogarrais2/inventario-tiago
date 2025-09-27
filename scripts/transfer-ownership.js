#!/usr/bin/env node

import prisma from "../src/lib/db.js";
import { UsuarioService } from "../src/lib/services.js";

async function transferOwnership() {
  try {
    console.log("🔄 Transferindo propriedade dos inventários...\n");

    // Buscar usuário de origem e destino
    const oldOwner = await UsuarioService.findByEmail(
      "tiago.arrais@ifce.edu.br"
    );
    const newOwner = await UsuarioService.findByEmail(
      "tiagoarraisholanda@gmail.com"
    );

    if (!oldOwner) {
      console.log("❌ Usuário tiago.arrais@ifce.edu.br não encontrado");
      return;
    }

    if (!newOwner) {
      console.log("❌ Usuário tiagoarraisholanda@gmail.com não encontrado");
      return;
    }

    console.log(`📤 De: ${oldOwner.nome} (${oldOwner.email})`);
    console.log(`📥 Para: ${newOwner.nome} (${newOwner.email})\n`);

    // Listar inventários do usuário antigo
    const inventarios = await prisma.inventario.findMany({
      where: { proprietarioId: oldOwner.id },
    });

    console.log(
      `📋 Encontrados ${inventarios.length} inventários para transferir:`
    );
    inventarios.forEach((inv) => {
      console.log(`- ${inv.nome}`);
    });

    if (inventarios.length === 0) {
      console.log("✅ Nenhum inventário para transferir");
      return;
    }

    // Transferir propriedade
    const result = await prisma.inventario.updateMany({
      where: { proprietarioId: oldOwner.id },
      data: { proprietarioId: newOwner.id },
    });

    console.log(`\n✅ ${result.count} inventários transferidos com sucesso!`);

    // Verificar resultado
    console.log("\n🔍 Verificando transferência...");
    const inventariosVerificacao = await prisma.inventario.findMany({
      where: { proprietarioId: newOwner.id },
      include: { proprietario: true },
    });

    inventariosVerificacao.forEach((inv) => {
      console.log(
        `✅ ${inv.nome} -> ${inv.proprietario.nome} (${inv.proprietario.email})`
      );
    });
  } catch (error) {
    console.error("❌ Erro:", error);
  }

  process.exit(0);
}

transferOwnership();
