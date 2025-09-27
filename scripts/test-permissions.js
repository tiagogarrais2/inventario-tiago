#!/usr/bin/env node

import { InventarioService, UsuarioService } from '../src/lib/services.js';
import prisma from '../src/lib/db.js';

async function testPermissions() {
  try {
    console.log('🔍 Testando verificação de permissões...\n');
    
    // Listar todos os usuários no banco
    console.log('� TODOS os usuários no banco:');
    const todosUsuarios = await prisma.usuario.findMany();
    todosUsuarios.forEach(user => {
      console.log(`- ID: ${user.id}, Nome: "${user.nome}", Email: "${user.email}"`);
    });
    
    // Listar todos os inventários
    console.log('\n� Inventários no banco:');
    const inventarios = await InventarioService.listUserInventarios('tiago.arrais@ifce.edu.br');
    inventarios.forEach(inv => {
      console.log(`- ${inv.nome} (proprietário: ${inv.proprietario.nome})`);
    });
    
    // Testar com o inventário mais recente
    if (inventarios.length > 0) {
      const inventarioTeste = inventarios[0].nome;
      console.log(`\n🔐 Testando permissões para: ${inventarioTeste}`);
      
      console.log('\n🔍 Testando com tiago.arrais@ifce.edu.br:');
      const permissoes1 = await InventarioService.checkPermissions(inventarioTeste, 'tiago.arrais@ifce.edu.br');
      console.log('Resultado:', permissoes1);
      
      console.log('\n🔍 Testando com tiagoarraisholanda@gmail.com:');
      const permissoes2 = await InventarioService.checkPermissions(inventarioTeste, 'tiagoarraisholanda@gmail.com');
      console.log('Resultado:', permissoes2);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
  
  process.exit(0);
}

testPermissions();