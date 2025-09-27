import {
  InventarioService,
  ItemInventarioService,
} from "../src/lib/services.js";

async function testSearch() {
  try {
    console.log("🔍 Testando busca de itens...");

    // Usar email do usuário logado para testar
    const userEmail = "tiagoarraisholanda@gmail.com";

    // Listar inventários disponíveis
    const inventarios = await InventarioService.listUserInventarios(userEmail);
    console.log(`📦 Inventários encontrados: ${inventarios.length}`);

    if (inventarios.length === 0) {
      console.log("❌ Nenhum inventário encontrado!");
      return;
    }

    const primeiroInventario = inventarios[0];
    console.log(`📂 Testando inventário: ${primeiroInventario.nome}`);

    // Listar itens do primeiro inventário
    const itens = await ItemInventarioService.listByInventario(
      primeiroInventario.nome
    );
    console.log(`📋 Itens encontrados no inventário: ${itens.length}`);

    if (itens.length === 0) {
      console.log("❌ Nenhum item encontrado no inventário!");
      return;
    }

    // Testar busca por número do primeiro item
    const primeiroItem = itens[0];
    console.log(`🔍 Testando busca pelo item: ${primeiroItem.numero}`);

    const itemEncontrado = await ItemInventarioService.findByNumero(
      primeiroInventario.nome,
      primeiroItem.numero
    );

    if (itemEncontrado) {
      console.log("✅ Item encontrado com sucesso:");
      console.log(`   - Número: ${itemEncontrado.numero}`);
      console.log(`   - Descrição: ${itemEncontrado.descricao}`);
      console.log(`   - Estado: ${itemEncontrado.estado}`);
    } else {
      console.log("❌ Item não encontrado na busca!");
    }
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

testSearch();
